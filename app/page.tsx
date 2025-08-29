import Link from 'next/link';
import { ArrowRight, Archive, Sparkles, Search } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            NOGWise
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Extracting wisdom (and humor) from network operator mailing lists
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Welcome to NOGWise
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              NOGWise processes mailing list archives from network operator groups and uses AI to generate 
              humorous &quot;words of wisdom&quot; from decades of technical discussions, debates, and troubleshooting tales.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-300">📚 Archive Collection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add mailing list archives from AusNOG, NANOG, and other network operator groups
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-300">🤖 AI Generation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use advanced AI to extract humorous and insightful wisdom from technical discussions
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">🔍 Semantic Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Search messages by meaning with AI-powered vector similarity
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-green-900 dark:text-green-300">💡 Share Wisdom</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Discover, vote on, and share the best nuggets of network operator wisdom
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 justify-center">
              <Link
                href="/archives"
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Archive className="w-5 h-5" />
                Manage Archives
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/wisdom"
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Sparkles className="w-5 h-5" />
                Generate Wisdom
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/search"
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Search className="w-5 h-5" />
                Semantic Search
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              🚀 Getting Started
            </h3>
            <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>1. Navigate to <Link href="/archives" className="text-purple-600 hover:underline">Archives</Link> to add your first mailing list</li>
              <li>2. Try adding: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">https://lists.ausnog.net/pipermail/ausnog/</code></li>
              <li>3. Wait for messages to sync (happens in background)</li>
              <li>4. Go to <Link href="/wisdom" className="text-purple-600 hover:underline">Wisdom</Link> to generate your first nugget of wisdom!</li>
              <li>5. Set your OpenAI API key in the <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env.local</code> file</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}