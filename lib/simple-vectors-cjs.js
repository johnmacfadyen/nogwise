// CommonJS version of simple-vectors for background scripts using Ollama
const fetch = require('node-fetch').default || require('node-fetch');

let config = null;
let isReady = false;

// Initialize Ollama client
function initializeAI() {
  config = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'gpt-oss'
  };
  
  isReady = true;
  console.log(`Ollama client initialized: ${config.baseUrl} with model ${config.embeddingModel}`);
  return true;
}

// Check if AI is ready
async function isAIReady() {
  if (!isReady) {
    return initializeAI();
  }
  return true;
}

// Generate embedding for text using Ollama
async function generateEmbedding(text) {
  if (!config) {
    throw new Error('Ollama not initialized');
  }
  
  try {
    const response = await fetch(`${config.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        prompt: text.substring(0, 8000), // Limit text length
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding with Ollama:', error);
    throw error;
  }
}

module.exports = {
  isAIReady,
  generateEmbedding,
  initializeAI
};