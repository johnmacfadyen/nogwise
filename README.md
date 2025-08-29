# NOGWise - Words of Wisdom from Mailing Lists

NOGWise is a Next.js application that processes mailing list archives from network operator groups (NOGs) and uses AI to generate humorous "words of wisdom" from technical discussions.

## Features

- 📚 **Archive Management**: Add and sync mailing list archives from sources like AusNOG, NANOG, etc.
- 🤖 **AI-Powered Generation**: Generate humorous, insightful, sarcastic, or philosophical wisdom using OpenAI
- 👍 **Voting System**: Upvote/downvote the best pieces of wisdom
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 💾 **Database Storage**: Persist archives, messages, and generated wisdom using SQLite

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your OpenAI API key:
   ```
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

## Getting Started

1. **Add an Archive**: Go to the Archives page and add a mailing list URL (e.g., `https://lists.ausnog.net/pipermail/ausnog/`)
2. **Wait for Sync**: The app will automatically fetch recent messages in the background
3. **Generate Wisdom**: Navigate to the Wisdom page and click "Generate Wisdom"
4. **Explore**: Browse, vote on, and share the generated wisdom

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Prisma** ORM with SQLite
- **OpenAI API** for AI generation
- **Cheerio** for web scraping
- **React Query** for data fetching

## API Routes

- `GET/POST /api/archives` - Manage mailing list archives
- `POST /api/archives/[id]/sync` - Sync messages from an archive
- `POST /api/wisdom/generate` - Generate new wisdom
- `GET /api/wisdom` - Fetch wisdom list
- `POST /api/wisdom/[id]/vote` - Vote on wisdom

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Schema

The app uses Prisma with SQLite to store:
- **Archives**: Mailing list sources
- **Messages**: Individual emails from archives
- **Wisdom**: Generated wisdom pieces
- **WisdomVote**: User votes on wisdom

## Contributing

Feel free to open issues or submit pull requests to improve NOGWise!

## License

MIT