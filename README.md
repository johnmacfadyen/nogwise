# NOGWise - Words of Wisdom from Mailing Lists

NOGWise is a Next.js application that processes mailing list archives from network operator groups (NOGs) and uses AI to generate humorous "words of wisdom" from technical discussions.

> ⚠️ **SECURITY WARNING**: This application currently has **NO AUTHENTICATION** or access controls. It is designed for local/private use only. **DO NOT expose this application to the public internet** without implementing proper authentication and authorization.

## Features

- 📚 **Archive Management**: Add and sync mailing list archives from sources like AusNOG, NANOG, etc.
- 🤖 **AI-Powered Generation**: Generate humorous, insightful, sarcastic, or philosophical wisdom using AI
- 🔍 **Semantic Search**: AI-powered search across all messages using vector embeddings
- 📊 **Statistics Dashboard**: View comprehensive stats about your archives
- 👍 **Voting System**: Upvote/downvote the best pieces of wisdom
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 💾 **Database Storage**: Persist archives, messages, and generated wisdom using SQLite
- 🏠 **Local AI Support**: Run completely offline using Ollama for privacy and control

## Prerequisites

- Node.js 18+ and npm
- (Optional) [Ollama](https://ollama.ai/) for local AI processing

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and configure your AI provider:
   
   **Option A: Use Ollama (Local AI - Recommended)**
   ```
   AI_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="llama3.2"
   OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
   ```
   
   **Option B: Use OpenAI**
   ```
   AI_PROVIDER="openai"
   OPENAI_API_KEY="sk-your-api-key-here"
   ```

3. **Initialize the database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Ollama Setup (For Local AI)

If you want to run NOGWise completely offline with local AI:

1. **Install Ollama** from [https://ollama.ai/](https://ollama.ai/)

2. **Pull required models:**
   ```bash
   # For text generation (choose one)
   ollama pull llama3.2       # Recommended: Fast and capable
   ollama pull llama3.1       # Alternative: Larger, more capable
   
   # For embeddings (required for search)
   ollama pull nomic-embed-text
   ```

3. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

## Getting Started

1. **Add an Archive**: 
   - Go to the Archives page
   - Add a mailing list URL (e.g., `https://lists.ausnog.net/pipermail/ausnog/`)
   - Or upload an mbox file directly

2. **Process Messages**: 
   - Messages are imported automatically
   - Go to Status page and click "Start Vectorization" for semantic search

3. **Generate Wisdom**: 
   - Navigate to the Wisdom page
   - Click "Generate Wisdom" to create AI-powered insights

4. **Search & Explore**: 
   - Use semantic search to find related discussions
   - Browse statistics and visualizations
   - Vote on the best pieces of wisdom

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Prisma** ORM with SQLite
- **AI Providers**: 
  - Ollama for local AI (recommended)
  - OpenAI API for cloud AI
- **Vector Search** for semantic similarity
- **Cheerio** for web scraping
- **React Query** for data fetching

## API Routes

- `GET/POST /api/archives` - Manage mailing list archives
- `POST /api/archives/upload` - Upload mbox files
- `POST /api/archives/[id]/sync` - Sync messages from an archive
- `POST /api/wisdom/generate` - Generate new wisdom
- `GET /api/wisdom` - Fetch wisdom list
- `POST /api/wisdom/[id]/vote` - Vote on wisdom
- `GET /api/search` - Semantic search across messages
- `GET /api/stats` - Archive statistics
- `POST /api/vectorize/start` - Start vectorization process

## Development

```bash
# Run development server (local access only)
npm run dev

# Build for production
npm run build

# Start production server (local access only)
npm start

# Run linter
npm run lint
```

### Security Considerations

- **No Authentication**: The application has no user authentication system
- **No Authorization**: All features are accessible to anyone with network access
- **Local Use Only**: Only run this on localhost or behind a private firewall
- **Data Sensitivity**: Imported messages and generated content are stored unencrypted

If you need to deploy this application publicly, consider:
1. Adding authentication (e.g., NextAuth.js)
2. Implementing role-based access control
3. Using HTTPS with proper certificates
4. Securing the database with encryption
5. Adding rate limiting to prevent abuse

## Database Schema

The app uses Prisma with SQLite to store:
- **Archives**: Mailing list sources
- **Messages**: Individual emails from archives  
- **MessageVectors**: Vector embeddings for semantic search
- **Wisdom**: Generated wisdom pieces
- **WisdomVote**: User votes on wisdom

## Performance & Scalability

NOGWise is designed to handle large archives efficiently:
- **Background Processing**: Large mbox files are processed in the background
- **Batch Vectorization**: Messages are vectorized in batches of 100
- **Optimized Search**: Vector similarity search for fast semantic queries
- **Responsive Stats**: Real-time statistics with automatic refresh

## Contributing

Feel free to open issues or submit pull requests to improve NOGWise!

## License

MIT