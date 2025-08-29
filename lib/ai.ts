import { prisma } from './db';
import { 
  findRelatedMessagesForWisdom, 
  addWisdomToVectorStore,
  searchMessages 
} from './simple-vectors';
import { generateText, isAIReady } from './ai-providers';

interface WisdomGenerationOptions {
  messageIds?: string[];
  topic?: string;
  style?: 'humorous' | 'insightful' | 'sarcastic' | 'philosophical';
  maxMessages?: number;
}

export class WisdomGenerator {
  async generateWisdom(options: WisdomGenerationOptions = {}): Promise<string> {
    const {
      messageIds,
      topic,
      style = 'humorous',
      maxMessages = 3,
    } = options;

    try {
      let messages;
      
      if (messageIds && messageIds.length > 0) {
        messages = await prisma.message.findMany({
          where: { id: { in: messageIds } },
          take: maxMessages,
        });
      } else if (topic) {
        // Use vector search for semantic similarity when a topic is provided
        console.log(`Using vector search for topic: ${topic}`);
        const vectorResults = await findRelatedMessagesForWisdom(topic, maxMessages);
        
        if (vectorResults.length > 0) {
          // Fetch full message data from database using the IDs from vector search
          messages = await prisma.message.findMany({
            where: { id: { in: vectorResults.map(r => r.id) } },
          });
        } else {
          // Fallback to traditional search if vector search returns nothing
          console.log('Vector search returned no results, falling back to keyword search');
          messages = await prisma.message.findMany({
            where: {
              OR: [
                { subject: { contains: topic } },
                { content: { contains: topic } },
              ],
            },
            orderBy: { date: 'desc' },
            take: maxMessages,
          });
        }
      } else {
        // Random selection when no topic is provided
        messages = await prisma.message.findMany({
          orderBy: { date: 'desc' },
          take: maxMessages * 2,
        });
        
        if (messages.length > maxMessages) {
          messages = messages.sort(() => Math.random() - 0.5).slice(0, maxMessages);
        }
      }

      if (messages.length === 0) {
        return "Even in the vast archives of network wisdom, sometimes silence speaks volumes. Try adding some archives first!";
      }

      const context = messages.map(m => 
        `Subject: ${m.subject}\nExcerpt: ${m.content.substring(0, 200)}...`
      ).join('\n\n---\n\n');

      const stylePrompts = {
        humorous: "Generate a humorous and witty piece of wisdom that network engineers would appreciate. Include technical references but make them funny and relatable.",
        insightful: "Generate a genuinely insightful observation about networking, technology, or engineering culture that feels profound yet practical.",
        sarcastic: "Generate a sarcastic but good-natured piece of wisdom that pokes fun at common networking problems or engineer habits.",
        philosophical: "Generate a philosophical reflection on networking that connects technical concepts to broader life lessons.",
      };

      // Build context-aware prompt using actual message content
      const prompt = `Based on these real network engineering discussions:

${context}

Generate a ${style} piece of networking wisdom about ${topic || 'networking'} in 2 sentences max. Draw insights from the actual technical content above. Make it quotable and technical but accessible.`;

      if (!isAIReady()) {
        return "The path to wisdom requires an AI provider. Configure either OpenAI or Ollama in your .env.local file.";
      }

      console.log(`Generating wisdom with style: ${style}, topic: ${topic || 'random'}`);
      console.log(`Messages found: ${messages.length}`);
      console.log(`Context length: ${context.length}`);
      console.log(`Prompt length: ${prompt.length}`);
      
      const wisdom = await generateText([
        {
          role: 'system',
          content: 'You are a network engineering sage who transforms technical discussions into memorable wisdom with the perfect blend of technical accuracy and humor. Use the provided context to create wisdom that reflects real network engineering experiences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        temperature: 0.8,
        maxTokens: 150,
      });
      
      console.log('Generated wisdom result:', wisdom);
      
      const finalWisdom = wisdom || "The packets must flow, even when the routes are unclear.";

      const createdWisdom = await prisma.wisdom.create({
        data: {
          content: finalWisdom,
          prompt: topic || 'random',
          messageIds: JSON.stringify(messages.map(m => m.id)),
          messages: {
            connect: messages.map(m => ({ id: m.id })),
          },
        },
      });

      // Add wisdom to vector store for similarity search
      await addWisdomToVectorStore({
        id: createdWisdom.id,
        content: createdWisdom.content,
        metadata: {
          wisdomId: createdWisdom.id,
          style,
          votes: 0,
          createdAt: createdWisdom.createdAt.toISOString(),
        },
      });

      return finalWisdom;
    } catch (error) {
      console.error('Error generating wisdom:', error);
      return "Sometimes even the wisest engineers encounter unexpected exceptions. Try again!";
    }
  }

  async getRandomWisdom(): Promise<string> {
    const wisdom = await prisma.wisdom.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (wisdom) {
      return wisdom.content;
    }

    return this.generateWisdom();
  }

  async getFeaturedWisdom() {
    return prisma.wisdom.findMany({
      where: { featured: true },
      orderBy: { votes: 'desc' },
      take: 10,
    });
  }

  async getTopWisdom() {
    return prisma.wisdom.findMany({
      orderBy: { votes: 'desc' },
      take: 20,
    });
  }
}