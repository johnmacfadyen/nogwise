import OpenAI from 'openai';

export interface AIProvider {
  generateEmbedding(text: string): Promise<number[] | null>;
  generateText(messages: Array<{ role: string; content: string }>, options?: { temperature?: number; maxTokens?: number }): Promise<string | null>;
  isReady(): boolean;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI | null;
  private embeddingModel: string;
  private chatModel: string;

  constructor() {
    this.client = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }) : null;
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.chatModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.client) return null;

    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text.slice(0, 8000),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      return null;
    }
  }

  async generateText(messages: Array<{ role: string; content: string }>, options?: { temperature?: number; maxTokens?: number }): Promise<string | null> {
    if (!this.client) return null;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.chatModel,
        messages: messages as any[],
        temperature: options?.temperature || 0.8,
        max_tokens: options?.maxTokens || 150,
      });

      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('OpenAI chat error:', error);
      return null;
    }
  }

  isReady(): boolean {
    return !!this.client;
  }
}

class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private embeddingModel: string;
  private chatModel: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
    this.chatModel = process.env.OLLAMA_CHAT_MODEL || 'gpt-oss';
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text.slice(0, 8000),
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding || null;
    } catch (error) {
      console.error('Ollama embedding error:', error);
      return null;
    }
  }

  async generateText(messages: Array<{ role: string; content: string }>, options?: { temperature?: number; maxTokens?: number }): Promise<string | null> {
    try {
      const requestBody = {
        model: this.chatModel,
        messages: messages,
        stream: false,
        options: {
          temperature: options?.temperature || 0.8,
        },
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama error response:', errorText);
        throw new Error(`Ollama chat failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.message?.content || null;
    } catch (error) {
      console.error('Ollama generate error:', error);
      return null;
    }
  }

  async isReady(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const models = data.models || [];
      
      // Check if both required models are available
      const hasEmbeddingModel = models.some((m: any) => m.name.includes(this.embeddingModel));
      const hasChatModel = models.some((m: any) => m.name.includes(this.chatModel));
      
      return hasEmbeddingModel && hasChatModel;
    } catch (error) {
      console.error('Ollama readiness check error:', error);
      return false;
    }
  }

  isReady(): boolean {
    // For the synchronous version, we'll assume it's ready if the URL is configured
    // The async version above is more accurate
    return !!this.baseUrl;
  }
}

// Factory function to get the configured AI provider
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'openai';
  
  switch (provider) {
    case 'ollama':
      return new OllamaProvider();
    case 'openai':
    default:
      return new OpenAIProvider();
  }
}

// Convenience functions
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const provider = getAIProvider();
  return provider.generateEmbedding(text);
}

export async function generateText(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  const provider = getAIProvider();
  return provider.generateText(messages, options);
}

export function isAIReady(): boolean {
  const provider = getAIProvider();
  return provider.isReady();
}