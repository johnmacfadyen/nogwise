const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Initialize AI providers - for background processing we'll skip vector generation to speed things up
const addMessageToVectorStore = async () => {
  // Skip vector generation in background processing for speed
  return true;
};

/**
 * Parse an mbox format buffer and extract messages (for large files)
 */
async function parseMboxBuffer(buffer, archiveId) {
  const messages = [];
  
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty mbox buffer');
  }
  
  console.log(`Processing mbox buffer of ${buffer.length} bytes`);
  
  // Process buffer in chunks to find message boundaries
  // Look for "\nFrom " pattern in the buffer
  const fromPattern = Buffer.from('\nFrom ');
  const messageStarts = [0]; // First message starts at beginning
  
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
 * Parse a single message from mbox format
 */
function parseMessage(messageBlock, archiveId) {
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
  const headerMap = new Map();
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
async function storeMessage(message, archiveId) {
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
    
    // Skip vector store for background processing to speed things up
    // Vector generation can be done later via a separate process if needed
    
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

/**
 * Generate a message ID if none exists
 */
function generateMessageId(headers, body) {
  const hash = crypto.createHash('md5');
  hash.update(headers + body);
  return `<generated-${hash.digest('hex')}@mbox>`;
}

/**
 * Generate thread ID from reply headers
 */
function generateThreadId(inReplyTo, references, subject) {
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
function cleanSubject(subject) {
  return subject
    .replace(/\[[\w-]+\]\s*/g, '') // Remove mailing list tags
    .replace(/^(Re:|Fwd:|FW:)\s*/gi, '') // Remove reply prefixes
    .replace(/\s+/g, ' ')
    .trim() || 'No Subject';
}

/**
 * Clean author field
 */
function cleanAuthor(author) {
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
function cleanMessageContent(content) {
  return content
    .replace(/^>.*$/gm, '') // Remove quoted lines
    .replace(/^\s*On .* wrote:\s*$/gm, '') // Remove "On ... wrote:" lines
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
}

module.exports = {
  parseMboxBuffer
};