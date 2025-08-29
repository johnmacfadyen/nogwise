// Load environment variables from .env.local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');
const { generateEmbedding, isAIReady } = require('../lib/simple-vectors-cjs.js');

const BATCH_SIZE = 100; // Process 100 messages at a time
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

async function vectorizeMessages() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting batch vectorization process...');
    
    if (!await isAIReady()) {
      console.log('AI provider not ready, exiting');
      process.exit(1);
    }

    let processedCount = 0;
    let totalProcessed = 0;
    
    while (true) {
      // Get next batch of messages without vectors
      console.log(`Fetching next batch of ${BATCH_SIZE} messages...`);
      
      const messages = await prisma.$queryRaw`
        SELECT m.id, m.messageId, m.subject, m.author, m.content, m.date
        FROM Message m
        LEFT JOIN MessageVector mv ON m.messageId = mv.messageId
        WHERE mv.messageId IS NULL
        LIMIT ${BATCH_SIZE}
      `;
      
      if (messages.length === 0) {
        console.log('No more messages to vectorize');
        break;
      }
      
      console.log(`Processing batch of ${messages.length} messages...`);
      
      for (const message of messages) {
        try {
          // Create content for embedding
          const content = `Subject: ${message.subject}\nAuthor: ${message.author}\nContent: ${message.content.substring(0, 2000)}`;
          
          // Generate embedding
          const embedding = await generateEmbedding(content);
          
          // Store vector
          await prisma.messageVector.create({
            data: {
              messageId: message.messageId,
              embedding: JSON.stringify(embedding),
              content: content.substring(0, 1000), // Store first 1000 chars for reference
            }
          });
          
          processedCount++;
          totalProcessed++;
          
          if (processedCount % 10 === 0) {
            console.log(`Processed ${processedCount} vectors in current batch, ${totalProcessed} total`);
          }
          
        } catch (error) {
          console.error(`Error processing message ${message.messageId}:`, error.message);
          // Continue with next message instead of failing entire batch
        }
      }
      
      console.log(`Batch completed. Processed ${processedCount} vectors total. Waiting ${DELAY_BETWEEN_BATCHES}ms...`);
      
      // Reset batch counter but keep total
      processedCount = 0;
      
      // Brief pause between batches to avoid overwhelming the AI API
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
    
    console.log(`Vectorization completed! Total vectors created: ${totalProcessed}`);
    
  } catch (error) {
    console.error('Error in vectorization process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

vectorizeMessages();