import axios from 'axios';
import * as cheerio from 'cheerio';
import { gunzipSync } from 'zlib';
import crypto from 'crypto';
import { prisma } from './db';
import { addMessageToVectorStore, deleteArchiveVectors } from './simple-vectors';
import { setSyncRunning, updateSyncProgress, setSyncComplete } from './sync-status';

interface ArchiveMonth {
  url: string;
  textUrl?: string;
  date: Date;
  messageCount?: number;
}

interface ParsedMessage {
  messageId: string;
  subject: string;
  author: string;
  date: Date;
  content: string;
  threadId?: string;
}

export class ArchiveScraper {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  async getArchiveMonths(): Promise<ArchiveMonth[]> {
    try {
      const response = await axios.get(this.baseUrl);
      const $ = cheerio.load(response.data);
      const months: ArchiveMonth[] = [];

      // Look for downloadable .txt and .txt.gz files
      $('a').each((_, link) => {
        const href = $(link).attr('href');
        if (!href) return;

        // Match YYYY-Month.txt or YYYY-Month.txt.gz files
        const fileMatch = href.match(/^(\d{4})-(\w+)\.(txt|txt\.gz)$/);
        if (fileMatch) {
          const [, year, monthName, extension] = fileMatch;
          
          try {
            // Parse the date
            const monthDate = new Date(`${monthName} 1, ${year}`);
            
            if (!isNaN(monthDate.getTime())) {
              const textUrl = new URL(href, this.baseUrl).toString();
              
              months.push({
                url: textUrl, // Use the same URL for both
                textUrl: textUrl,
                date: monthDate,
                messageCount: 0, // We'll determine this when we download
              });
            }
          } catch (error) {
            console.warn(`Could not parse date for ${href}:`, error);
          }
        }
      });

      // Sort by date, newest first
      const sortedMonths = months.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      console.log(`Found ${sortedMonths.length} downloadable archives`);
      return sortedMonths;
    } catch (error) {
      console.error('Error fetching archive months:', error);
      throw error;
    }
  }

  async fetchMonthArchive(monthUrl: string): Promise<ParsedMessage[]> {
    try {
      const isGzipped = monthUrl.endsWith('.gz');
      
      const response = await axios.get(monthUrl, {
        responseType: isGzipped ? 'arraybuffer' : 'text',
        headers: {
          'Accept-Encoding': isGzipped ? 'identity' : 'gzip, deflate',
        },
        timeout: 60000, // 60 second timeout for large files
      });

      let textData: string;
      
      if (isGzipped) {
        // Decompress gzipped content
        const buffer = Buffer.from(response.data);
        const decompressed = gunzipSync(buffer);
        textData = decompressed.toString('utf-8');
      } else {
        textData = response.data;
      }

      console.log(`Downloaded ${monthUrl}, size: ${textData.length} characters`);
      return this.parseMailArchive(textData);
    } catch (error) {
      console.error(`Error fetching month archive ${monthUrl}:`, error);
      return [];
    }
  }

  private parseMailArchive(text: string): ParsedMessage[] {
    const messages: ParsedMessage[] = [];
    
    // Split on "From " at the beginning of lines (mbox format)
    const messageBlocks = text.split(/^From /m).filter(block => block.trim());

    console.log(`Parsing ${messageBlocks.length} message blocks`);

    for (let blockIndex = 0; blockIndex < messageBlocks.length; blockIndex++) {
      const block = messageBlocks[blockIndex];
      const lines = block.split('\n');
      const headers: { [key: string]: string } = {};
      let contentStartIndex = 0;

      // Parse headers
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Empty line indicates end of headers
        if (line.trim() === '') {
          contentStartIndex = i + 1;
          break;
        }

        // Header line (starts with letter, contains colon)
        const headerMatch = line.match(/^([A-Za-z-]+):\s*(.*)$/);
        if (headerMatch) {
          const [, key, value] = headerMatch;
          headers[key.toLowerCase()] = value.trim();
        } 
        // Continuation line (starts with whitespace)
        else if ((line.startsWith(' ') || line.startsWith('\t')) && i > 0) {
          const lastKey = Object.keys(headers).pop();
          if (lastKey) {
            headers[lastKey] += ' ' + line.trim();
          }
        }
      }

      // Extract message information
      const messageId = headers['message-id'] || this.generateMessageId(block);
      const subject = this.cleanSubject(headers['subject'] || 'No Subject');
      const from = headers['from'] || 'Unknown';
      const dateStr = headers['date'];
      const content = lines.slice(contentStartIndex).join('\n').trim();
      const inReplyTo = headers['in-reply-to'];

      // Parse date with same logic as mbox parser
      let date = new Date('1990-01-01'); // Default to old date instead of current date
      if (dateStr) {
        try {
          const parsedDate = new Date(dateStr);
          const currentYear = new Date().getFullYear();
          const maxValidYear = currentYear + 1; // Allow up to 1 year in the future
          
          if (!isNaN(parsedDate.getTime()) && 
              parsedDate.getFullYear() > 1990 && 
              parsedDate.getFullYear() <= maxValidYear) {
            date = parsedDate;
          }
        } catch {
          // Keep default fallback date
        }
      }

      // Only include messages with some content (exclude completely empty messages)
      if (content && content.length > 10) {
        messages.push({
          messageId: messageId.replace(/[<>]/g, ''),
          subject,
          author: this.extractAuthorName(from),
          date,
          content: content.substring(0, 50000), // Limit content size
          threadId: inReplyTo ? inReplyTo.replace(/[<>]/g, '') : undefined,
        });
      }
    }

    console.log(`Parsed ${messages.length} valid messages`);
    return messages;
  }

  private cleanSubject(subject: string): string {
    // Remove common prefixes and clean up
    return subject
      .replace(/^(Re:\s*|Fwd:\s*|FW:\s*)+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractAuthorName(from: string): string {
    const match = from.match(/^([^<]+)(?:<|$)/);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
    const emailMatch = from.match(/([^@]+)@/);
    return emailMatch ? emailMatch[1] : from;
  }

  private generateMessageId(content: string): string {
    // Generate a stable MD5 hash-based ID like the mbox parser
    const hash = crypto.createHash('md5');
    hash.update(content);
    return `<generated-${hash.digest('hex')}@archive>`;
  }

  async syncArchive(archiveUrl: string, archiveName: string): Promise<void> {
    try {
      let archive = await prisma.archive.findUnique({
        where: { url: archiveUrl },
      });

      if (!archive) {
        archive = await prisma.archive.create({
          data: {
            url: archiveUrl,
            name: archiveName,
            description: `Mailing list archive for ${archiveName}`,
          },
        });
      }

      const scraper = new ArchiveScraper(archiveUrl);
      const months = await scraper.getArchiveMonths();
      
      // Process ALL available months for complete archive coverage
      // Sort by date descending (newest first) to get recent data first, then historical
      const selectedMonths = months.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      console.log(`Found ${selectedMonths.length} total months available for processing`);
      
      // Set up sync status tracking
      setSyncRunning(archive.id, selectedMonths.length);
      
      // Clear existing vectors for this archive (in case of re-sync)
      console.log('Clearing existing vectors...');
      await deleteArchiveVectors(archive.id);
      
      let totalMessages = 0;
      let vectorizedMessages = 0;
      
      console.log(`Processing ${selectedMonths.length} months for ${archiveName}`);
      console.log(`Months selected: ${selectedMonths.map(m => m.date.toISOString().slice(0, 7)).join(', ')}`);
      
      for (let i = 0; i < selectedMonths.length; i++) {
        const month = selectedMonths[i];
        if (month.textUrl) {
          const monthName = month.date.toISOString().slice(0, 7);
          console.log(`[${i + 1}/${selectedMonths.length}] Fetching ${monthName}...`);
          
          // Update sync progress
          updateSyncProgress(archive.id, i + 1, monthName);
          
          const messages = await scraper.fetchMonthArchive(month.textUrl);
          console.log(`Found ${messages.length} messages in ${monthName}`);
          
          // Batch process messages for better performance
          for (let j = 0; j < messages.length; j++) {
            const message = messages[j];
            try {
              const savedMessage = await prisma.message.upsert({
                where: { messageId: message.messageId },
                update: {
                  subject: message.subject,
                  author: message.author,
                  content: message.content,
                  date: message.date,
                  threadId: message.threadId,
                },
                create: {
                  archiveId: archive.id,
                  messageId: message.messageId,
                  subject: message.subject,
                  author: message.author,
                  content: message.content,
                  date: message.date,
                  threadId: message.threadId,
                },
              });
              
              totalMessages++;
              
              // Add to vector store for semantic search
              if (savedMessage.content.length > 25) { // Only vectorize messages with meaningful content
                const success = await addMessageToVectorStore({
                  id: savedMessage.id,
                  content: savedMessage.content,
                  metadata: {
                    messageId: savedMessage.messageId,
                    subject: savedMessage.subject,
                    author: savedMessage.author,
                    date: savedMessage.date.toISOString(),
                    archiveId: savedMessage.archiveId,
                    threadId: savedMessage.threadId || undefined,
                  },
                });
                if (success) vectorizedMessages++;
              }

              // Log progress every 100 messages
              if (j > 0 && j % 100 === 0) {
                console.log(`  Processed ${j}/${messages.length} messages from ${monthName}`);
              }
            } catch (error) {
              console.error(`Error saving message ${message.messageId}:`, error);
            }
          }
          
          console.log(`✓ Completed ${monthName}: ${messages.length} messages processed`);
        }
      }

      await prisma.archive.update({
        where: { id: archive.id },
        data: { lastFetched: new Date() },
      });

      console.log(`Successfully synced ${archiveName}`);
      console.log(`Total messages: ${totalMessages}, Vectorized: ${vectorizedMessages}`);
      
      // Mark sync as complete
      setSyncComplete(archive.id);
    } catch (error) {
      console.error('Error syncing archive:', error);
      // Mark sync as complete even on error
      setSyncComplete(archive.id);
      throw error;
    }
  }
}