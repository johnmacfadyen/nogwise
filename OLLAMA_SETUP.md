# Ollama Integration for NOGWise

NOGWise can use Ollama for both text generation and vector embeddings, keeping everything local and free!

## Setup Instructions

### 1. Install Required Models

You'll need two models in Ollama:

```bash
# For embeddings (required for vector search)
ollama pull nomic-embed-text

# For text generation (if you don't already have gpt-oss:20b)
ollama pull gpt-oss:20b
```

### 2. Configure Environment

Update your `.env.local` file:

```bash
# AI Provider Configuration
AI_PROVIDER="ollama"

# Ollama Configuration
OLLAMA_BASE_URL="http://192.168.1.10:11434"
OLLAMA_CHAT_MODEL="gpt-oss:20b"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
```

### 3. Verify Setup

Once configured, NOGWise will automatically:
- Use `nomic-embed-text` for vector embeddings when processing archives
- Use `gpt-oss` for generating wisdom from mailing list discussions
- Display "Vectorized: X" messages when syncing archives (instead of 0)

## Alternative Models

### Embedding Models
- `nomic-embed-text` (recommended) - Good quality, fast
- `all-minilm` - Smaller, faster, lower quality
- `mxbai-embed-large` - Higher quality, slower

### Chat Models  
- `gpt-oss:20b` (your current model) - Large, high-quality responses
- `llama3.1:8b` - Good general purpose
- `mistral:7b` - Fast and capable
- `qwen2.5:7b` - Good for technical content

### Example with Different Models

```bash
# Try a larger embedding model for better quality
ollama pull mxbai-embed-large

# Update .env.local
OLLAMA_EMBEDDING_MODEL="mxbai-embed-large"
```

## Troubleshooting

### Check Ollama Status
```bash
ollama list
```

### Test Embedding Generation
```bash
curl http://192.168.1.10:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "test message"}'
```

### View Logs
Check the NOGWise console for embedding generation messages. You should see:
- "Found X messages in YYYY-MM"
- "Total messages: X, Vectorized: Y" (where Y > 0)

## Performance Notes

- **Embedding Generation**: ~100-500ms per message depending on model and hardware
- **Memory Usage**: Models require 2-8GB RAM depending on size
- **Speed**: Local processing, no API limits or costs!

## Benefits of Ollama Integration

✅ **Free**: No API costs  
✅ **Private**: All processing stays local  
✅ **Fast**: No network requests for embeddings  
✅ **Customizable**: Choose your preferred models  
✅ **Reliable**: No rate limits or API downtime  

The vector search and wisdom generation will work exactly the same as with OpenAI, but everything runs locally through your Ollama server!