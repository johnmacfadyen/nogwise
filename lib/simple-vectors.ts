import { prisma } from './db';
import { generateEmbedding as providerGenerateEmbedding, isAIReady } from './ai-providers';

// Simple in-memory vector store for development
// In production, this would be PostgreSQL + pgvector

interface MessageVector {
  id: string;
  messageId: string;
  embedding: number[];
  content: string;
  metadata: {
    messageId: string;
    subject: string;
    author: string;
    date: string;
    archiveId: string;
    threadId?: string;
  };
}

interface WisdomVector {
  id: string;
  wisdomId: string;
  embedding: number[];
  content: string;
  metadata: {
    style?: string;
    votes: number;
    createdAt: string;
  };
}

// In-memory storage (would be replaced by PostgreSQL + pgvector in production)
const messageVectors = new Map<string, MessageVector>();
const wisdomVectors = new Map<string, WisdomVector>();

// Generate embeddings using the configured AI provider (OpenAI or Ollama)
export async function generateEmbedding(text: string): Promise<number[] | null> {
  return providerGenerateEmbedding(text);
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Add message to vector store
export async function addMessageToVectorStore(messageData: {
  id: string;
  content: string;
  metadata: {
    messageId: string;
    subject: string;
    author: string;
    date: string;
    archiveId: string;
    threadId?: string;
  };
}): Promise<boolean> {
  try {
    const embeddingText = `Subject: ${messageData.metadata.subject}\n\n${messageData.content}`;
    const embedding = await generateEmbedding(embeddingText);
    
    if (!embedding) return false;

    // Store in database
    await prisma.messageVector.upsert({
      where: { messageId: messageData.metadata.messageId },
      update: {
        embedding: JSON.stringify(embedding),
        content: messageData.content,
      },
      create: {
        messageId: messageData.metadata.messageId,
        embedding: JSON.stringify(embedding),
        content: messageData.content,
      },
    });

    // Also keep in memory for performance during the current session
    const vectorData: MessageVector = {
      id: messageData.id,
      messageId: messageData.metadata.messageId,
      embedding,
      content: messageData.content,
      metadata: messageData.metadata,
    };

    messageVectors.set(messageData.id, vectorData);
    console.log(`Vector stored for message ${messageData.id}. Total in-memory: ${messageVectors.size}`);
    return true;
  } catch (error) {
    console.error('Error adding message to vector store:', error);
    return false;
  }
}

// Add wisdom to vector store
export async function addWisdomToVectorStore(wisdomData: {
  id: string;
  content: string;
  metadata: {
    wisdomId: string;
    style?: string;
    votes: number;
    createdAt: string;
  };
}): Promise<boolean> {
  try {
    const embedding = await generateEmbedding(wisdomData.content);
    
    if (!embedding) return false;

    // Store in database
    await prisma.wisdomVector.upsert({
      where: { wisdomId: wisdomData.metadata.wisdomId },
      update: {
        embedding: JSON.stringify(embedding),
        content: wisdomData.content,
      },
      create: {
        wisdomId: wisdomData.metadata.wisdomId,
        embedding: JSON.stringify(embedding),
        content: wisdomData.content,
      },
    });

    // Also keep in memory for performance during the current session
    const vectorData: WisdomVector = {
      id: wisdomData.id,
      wisdomId: wisdomData.metadata.wisdomId,
      embedding,
      content: wisdomData.content,
      metadata: wisdomData.metadata,
    };

    wisdomVectors.set(wisdomData.id, vectorData);
    return true;
  } catch (error) {
    console.error('Error adding wisdom to vector store:', error);
    return false;
  }
}

// Search messages by semantic similarity
export async function searchMessages(
  query: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  content: string;
  metadata: {
    messageId: string;
    subject: string;
    author: string;
    date: string;
    archiveId: string;
    threadId?: string;
  };
  similarity?: number;
}>> {
  try {
    // If in-memory vectors are empty, try to load from database with timeout
    if (messageVectors.size === 0) {
      console.log(`No message vectors in memory. Loading from database...`);
      try {
        await initializeVectorSystem();
      } catch (error) {
        console.error('Vector initialization failed:', error);
        return [];
      }
      
      if (messageVectors.size === 0) {
        console.log(`No message vectors available for search after initialization.`);
        return [];
      }
    }
    
    console.log(`Searching ${messageVectors.size} vectors for: "${query}"`);

    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) return [];

    const results: Array<{
      id: string;
      content: string;
      metadata: {
        messageId: string;
        subject: string;
        author: string;
        date: string;
        archiveId: string;
        threadId?: string;
      };
      similarity: number;
    }> = [];

    for (const vector of messageVectors.values()) {
      const similarity = cosineSimilarity(queryEmbedding, vector.embedding);
      results.push({
        id: vector.id,
        content: vector.content,
        metadata: vector.metadata,
        similarity,
      });
    }

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
}

// Find related messages for wisdom generation
export async function findRelatedMessagesForWisdom(
  topic: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  content: string;
  metadata: {
    messageId: string;
    subject: string;
    author: string;
    date: string;
    archiveId: string;
    threadId?: string;
  };
}>> {
  try {
    const enhancedQuery = `network operations ${topic} technical discussion troubleshooting`;
    const results = await searchMessages(enhancedQuery, limit * 2);
    
    // Deduplicate by thread and return top matches
    const seen = new Set<string>();
    const filtered: Array<{
      id: string;
      content: string;
      metadata: {
        messageId: string;
        subject: string;
        author: string;
        date: string;
        archiveId: string;
        threadId?: string;
      };
    }> = [];

    for (const result of results) {
      const threadKey = result.metadata.threadId || result.metadata.messageId;
      
      if (!seen.has(threadKey)) {
        seen.add(threadKey);
        filtered.push({
          id: result.id,
          content: result.content,
          metadata: result.metadata,
        });
      }

      if (filtered.length >= limit) break;
    }

    return filtered;
  } catch (error) {
    console.error('Error finding related messages:', error);
    return [];
  }
}

// Get message clusters (simplified version using common topics)
export async function getMessageClusters(
  archiveId?: string,
  numClusters: number = 10
): Promise<Array<{ topic: string; messages: Array<{
  id: string;
  content: string;
  metadata: MessageVector['metadata'];
}> }>> {
  try {
    // Check if vector system is available and try to initialize if needed
    if (messageVectors.size === 0) {
      console.log('No vectors available for clustering, attempting to load...');
      try {
        await initializeVectorSystem();
      } catch (error) {
        console.error('Failed to initialize vectors for clustering:', error);
        return [];
      }
      
      if (messageVectors.size === 0) {
        console.log('Still no vectors available after initialization');
        return [];
      }
    }

    const topics = [
      'BGP routing issues',
      'DNS problems and configuration', 
      'IPv6 deployment',
      'Network security incidents',
      'Peering and interconnection',
      'Hardware failures',
      'Performance optimization',
      'Outage post-mortems',
      'Configuration management',
      'Monitoring and alerting',
    ];

    const clusters = await Promise.all(
      topics.slice(0, numClusters).map(async (topic) => {
        try {
          const messages = await searchMessages(topic, 20);
          return {
            topic,
            messages: (archiveId 
              ? messages.filter(msg => msg.metadata.archiveId === archiveId)
              : messages
            ).map(msg => ({
              id: msg.id,
              content: msg.content,
              metadata: msg.metadata,
            }))
          };
        } catch (error) {
          console.error(`Error searching for topic "${topic}":`, error);
          return { topic, messages: [] };
        }
      })
    );

    return clusters.filter(cluster => cluster.messages.length > 0);
  } catch (error) {
    console.error('Error getting message clusters:', error);
    return [];
  }
}

// Delete vectors for an archive
export async function deleteArchiveVectors(archiveId: string): Promise<void> {
  try {
    const toDelete: string[] = [];
    
    for (const [id, vector] of messageVectors.entries()) {
      if (vector.metadata.archiveId === archiveId) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      messageVectors.delete(id);
    }

    console.log(`Deleted ${toDelete.length} vectors for archive ${archiveId}`);
  } catch (error) {
    console.error('Error deleting archive vectors:', error);
  }
}

// Check if vector system is ready
export async function isVectorDBReady(): Promise<boolean> {
  return isAIReady();
}

// Get stats about the vector store
export async function getVectorStats(): Promise<{
  messageCount: number;
  wisdomCount: number;
  isReady: boolean;
}> {
  try {
    const messageCount = await prisma.messageVector.count();
    const wisdomCount = await prisma.wisdomVector.count();
    
    return {
      messageCount,
      wisdomCount,
      isReady: isAIReady(),
    };
  } catch (error) {
    console.error('Error getting vector stats:', error);
    return {
      messageCount: messageVectors.size,
      wisdomCount: wisdomVectors.size,
      isReady: isAIReady(),
    };
  }
}

// Initialize the vector system (load existing vectors from database)
export async function initializeVectorSystem(): Promise<void> {
  try {
    if (!isAIReady()) {
      console.log('Vector system disabled - AI provider not ready');
      return;
    }

    console.log('Initializing vector system...');
    
    // Load message vectors from database (limit to prevent memory issues)
    const messageVectorRecords = await prisma.messageVector.findMany({
      take: 1000 // Start with just 1000 vectors for testing
    });
    
    console.log(`Loading ${messageVectorRecords.length} message vectors from database...`);
    
    for (const record of messageVectorRecords) {
      try {
        // Get the message details for metadata
        const message = await prisma.message.findFirst({
          where: { messageId: record.messageId }
        });
        
        if (message) {
          const vectorData: MessageVector = {
            id: message.id,
            messageId: record.messageId,
            embedding: JSON.parse(record.embedding),
            content: record.content,
            metadata: {
              messageId: message.messageId,
              subject: message.subject,
              author: message.author,
              date: message.date.toISOString(),
              archiveId: message.archiveId,
              threadId: message.threadId || undefined,
            },
          };
          
          messageVectors.set(message.id, vectorData);
        }
      } catch (error) {
        console.error(`Error loading vector for message ${record.messageId}:`, error);
      }
    }
    
    // Load wisdom vectors from database
    const wisdomVectorRecords = await prisma.wisdomVector.findMany();
    
    console.log(`Loading ${wisdomVectorRecords.length} wisdom vectors from database...`);
    
    for (const record of wisdomVectorRecords) {
      try {
        // Get the wisdom details for metadata
        const wisdom = await prisma.wisdom.findUnique({
          where: { id: record.wisdomId }
        });
        
        if (wisdom) {
          const vectorData: WisdomVector = {
            id: wisdom.id,
            wisdomId: record.wisdomId,
            embedding: JSON.parse(record.embedding),
            content: record.content,
            metadata: {
              style: 'humorous', // Default style
              votes: wisdom.votes,
              createdAt: wisdom.createdAt.toISOString(),
            },
          };
          
          wisdomVectors.set(wisdom.id, vectorData);
        }
      } catch (error) {
        console.error(`Error loading vector for wisdom ${record.wisdomId}:`, error);
      }
    }
    
    console.log(`Vector system ready. Loaded ${messageVectors.size} message vectors and ${wisdomVectors.size} wisdom vectors.`);
    
  } catch (error) {
    console.error('Error initializing vector system:', error);
  }
}

// Generate vectors for all messages that don't have them yet
export async function generateMissingVectors(): Promise<void> {
  try {
    if (!isAIReady()) {
      console.log('Vector generation disabled - AI provider not ready');
      return;
    }

    console.log('Finding messages without vectors...');
    
    // Find messages that don't have vectors
    const messagesWithoutVectors = await prisma.message.findMany({
      where: {
        messageId: {
          notIn: await prisma.messageVector.findMany({
            select: { messageId: true }
          }).then(vectors => vectors.map(v => v.messageId))
        }
      },
      select: {
        id: true,
        messageId: true,
        subject: true,
        author: true,
        date: true,
        content: true,
        archiveId: true,
        threadId: true,
      }
    });

    console.log(`Found ${messagesWithoutVectors.length} messages without vectors. Starting generation...`);
    
    let processed = 0;
    for (const message of messagesWithoutVectors) {
      try {
        const success = await addMessageToVectorStore({
          id: message.id,
          content: message.content,
          metadata: {
            messageId: message.messageId,
            subject: message.subject,
            author: message.author,
            date: message.date.toISOString(),
            archiveId: message.archiveId,
            threadId: message.threadId || undefined,
          },
        });
        
        if (success) {
          processed++;
          if (processed % 10 === 0) {
            console.log(`Generated vectors for ${processed}/${messagesWithoutVectors.length} messages`);
          }
        }
      } catch (error) {
        console.error(`Error generating vector for message ${message.messageId}:`, error);
      }
    }
    
    console.log(`Vector generation complete. Generated ${processed} new vectors.`);
  } catch (error) {
    console.error('Error generating missing vectors:', error);
  }
}