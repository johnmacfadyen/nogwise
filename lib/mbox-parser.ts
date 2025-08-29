import { prisma } from './db';
import { addMessageToVectorStore } from './simple-vectors';
import crypto from 'crypto';

interface ParsedMessage {
  messageId: string;
  subject: string;
  author: string;
  date: Date;
  content: string;
  threadId?: string;
}

/**
 * Parse an mbox format buffer and extract messages (for large files)
 */
export async function parseMboxBuffer(buffer: Buffer, archiveId: string): Promise<ParsedMessage[]> {
  const messages: ParsedMessage[] = [];
  
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty mbox buffer');
  }
  
  console.log(`Processing mbox buffer of ${buffer.length} bytes`);
  
  // Process buffer in chunks to find message boundaries
  // Look for "\nFrom " pattern in the buffer
  const fromPattern = Buffer.from('\nFrom ');
  const messageStarts: number[] = [0]; // First message starts at beginning
  
  let position = 0;
  while (position < buffer.length) {
    const nextFrom = buffer.indexOf(fromPattern, position);
    if (nextFrom === -1) break;
    messageStarts.push(nextFrom + 1); // +1 to skip the \n
    position = nextFrom + fromPattern.length;
  }
  
  console.log(`Found ${messageStarts.length} message boundaries`);
  
  // Process each message
  for (let i = 0; i < messageStarts.length - 1; i++) {
    try {
      const start = messageStarts[i];
      const end = messageStarts[i + 1];
      const messageBuffer = buffer.slice(start, end);
      
      // Convert this smaller chunk to string
      const messageContent = messageBuffer.toString('utf-8');
      
      const parsedMessage = parseMessage(messageContent, archiveId);
      if (parsedMessage) {
        messages.push(parsedMessage);
        
        // Store in database
        await storeMessage(parsedMessage, archiveId);
        
        // Log progress
        if ((i + 1) % 100 === 0) {
          console.log(`Processed ${i + 1}/${messageStarts.length - 1} messages`);
        }
      }
    } catch (error) {
      console.error(`Error parsing message ${i + 1}:`, error);
    }
  }
  
  // Handle the last message (from last boundary to end of buffer)
  if (messageStarts.length > 0) {
    try {
      const lastStart = messageStarts[messageStarts.length - 1];
      const lastMessageBuffer = buffer.slice(lastStart);
      const lastMessageContent = lastMessageBuffer.toString('utf-8');
      
      const parsedMessage = parseMessage(lastMessageContent, archiveId);
      if (parsedMessage) {
        messages.push(parsedMessage);
        await storeMessage(parsedMessage, archiveId);
      }
    } catch (error) {
      console.error('Error parsing last message:', error);
    }
  }
  
  console.log(`Successfully parsed ${messages.length} messages from buffer`);
  return messages;
}

/**
 * Parse an mbox format file and extract messages (legacy string version)
 */
export async function parseMboxFile(content: string, archiveId: string): Promise<ParsedMessage[]> {
  const messages: ParsedMessage[] = [];
  
  if (!content || content.length === 0) {
    throw new Error('Empty mbox content');
  }
  
  // Split mbox content by message boundaries
  // Mbox format uses "From " at the beginning of a line to separate messages
  const messageBlocks = content.split(/\nFrom /);
  
  console.log(`Found ${messageBlocks.length} message blocks in mbox file`);
  console.log(`Sample first block (first 200 chars): ${messageBlocks[0]?.substring(0, 200)}`);
  
  for (let i = 0; i < messageBlocks.length; i++) {
    try {
      let messageBlock = messageBlocks[i];
      
      // Add back the "From " prefix if it's not the first message
      if (i > 0) {
        messageBlock = 'From ' + messageBlock;
      }
      
      const parsedMessage = parseMessage(messageBlock, archiveId);
      if (parsedMessage) {
        messages.push(parsedMessage);
        
        // Store in database
        await storeMessage(parsedMessage, archiveId);
        
        // Log progress
        if ((i + 1) % 100 === 0) {
          console.log(`Processed ${i + 1}/${messageBlocks.length} messages`);
        }
      }
    } catch (error) {
      console.error(`Error parsing message ${i + 1}:`, error);
    }
  }
  
  console.log(`Successfully parsed ${messages.length} messages`);
  return messages;
}

/**
 * Parse a single message from mbox format
 */
function parseMessage(messageBlock: string, archiveId: string): ParsedMessage | null {
  if (!messageBlock.trim()) {
    console.log('Empty message block, skipping');
    return null;
  }
  
  // Split headers and body
  const headerBodySplit = messageBlock.indexOf('\n\n');
  if (headerBodySplit === -1) {
    console.log('No header-body separator found, skipping message');
    return null;
  }
  
  const headers = messageBlock.substring(0, headerBodySplit);
  const body = messageBlock.substring(headerBodySplit + 2);
  
  // Parse headers
  const headerMap = new Map<string, string>();
  const headerLines = headers.split('\n');
  let currentHeader = '';
  let currentValue = '';
  
  for (const line of headerLines) {
    if (line.match(/^[A-Za-z-]+:/)) {
      // New header
      if (currentHeader) {
        headerMap.set(currentHeader.toLowerCase(), currentValue.trim());
      }
      const colonIndex = line.indexOf(':');
      currentHeader = line.substring(0, colonIndex);
      currentValue = line.substring(colonIndex + 1);
    } else if (line.startsWith(' ') || line.startsWith('\t')) {
      // Continuation of previous header
      currentValue += ' ' + line.trim();
    }
  }
  
  // Store last header
  if (currentHeader) {
    headerMap.set(currentHeader.toLowerCase(), currentValue.trim());
  }
  
  // Extract required fields
  const messageId = headerMap.get('message-id') || generateMessageId(headers, body);
  const subject = cleanSubject(headerMap.get('subject') || 'No Subject');
  const author = cleanAuthor(headerMap.get('from') || 'Unknown');
  const dateStr = headerMap.get('date');
  const inReplyTo = headerMap.get('in-reply-to');
  const references = headerMap.get('references');
  
  // Parse date
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
  
  // Generate thread ID
  const threadId = generateThreadId(inReplyTo, references, subject);
  
  // Clean body content
  const content = cleanMessageContent(body);
  
  return {
    messageId,
    subject,
    author,
    date,
    content,
    threadId
  };
}

/**
 * Store parsed message in database
 */
async function storeMessage(message: ParsedMessage, archiveId: string): Promise<void> {
  try {
    // Store in database
    const dbMessage = await prisma.message.upsert({
      where: { messageId: message.messageId },
      update: {
        subject: message.subject,
        author: message.author,
        content: message.content,
        date: message.date,
        threadId: message.threadId,
        archiveId
      },
      create: {
        messageId: message.messageId,
        subject: message.subject,
        author: message.author,
        content: message.content,
        date: message.date,
        threadId: message.threadId,
        archiveId
      }
    });
    
    // Add to vector store
    await addMessageToVectorStore({
      id: dbMessage.id,
      content: message.content,
      metadata: {
        messageId: message.messageId,
        subject: message.subject,
        author: message.author,
        date: message.date.toISOString(),
        archiveId,
        threadId: message.threadId
      }
    });
    
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

/**
 * Generate a message ID if none exists
 */
function generateMessageId(headers: string, body: string): string {
  const hash = crypto.createHash('md5');
  hash.update(headers + body);
  return `<generated-${hash.digest('hex')}@mbox>`;
}

/**
 * Generate thread ID from reply headers
 */
function generateThreadId(inReplyTo?: string, references?: string, subject?: string): string | undefined {
  if (inReplyTo) {
    return inReplyTo.replace(/[<>]/g, '');
  }
  
  if (references) {
    const refs = references.split(/\s+/);
    if (refs.length > 0) {
      return refs[0].replace(/[<>]/g, '');
    }
  }
  
  // For subjects with Re: prefix, try to group by base subject
  if (subject && subject.toLowerCase().startsWith('re:')) {
    const baseSubject = subject.replace(/^re:\s*/i, '').trim();
    if (baseSubject) {
      const hash = crypto.createHash('md5');
      hash.update(baseSubject.toLowerCase());
      return `thread-${hash.digest('hex')}`;
    }
  }
  
  return undefined;
}

/**
 * Clean subject line
 */
function cleanSubject(subject: string): string {
  return subject
    .replace(/\[[\w-]+\]\s*/g, '') // Remove mailing list tags
    .replace(/^(Re:|Fwd:|FW:)\s*/gi, '') // Remove reply prefixes
    .replace(/\s+/g, ' ')
    .trim() || 'No Subject';
}

/**
 * Clean author field
 */
function cleanAuthor(author: string): string {
  // Extract email or name from "Name <email>" format
  const match = author.match(/^(.+?)\s*<(.+?)>$/) || author.match(/^(.+?)$/);
  if (match) {
    return match[1].trim().replace(/^"|"$/g, '') || match[2]?.trim() || 'Unknown';
  }
  return author.trim() || 'Unknown';
}

/**
 * Clean message content
 */
function cleanMessageContent(content: string): string {
  return content
    .replace(/^>.*$/gm, '') // Remove quoted lines
    .replace(/^\s*On .* wrote:\s*$/gm, '') // Remove "On ... wrote:" lines
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
}