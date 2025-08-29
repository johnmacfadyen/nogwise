import SemanticSearch from '@/components/SemanticSearch';
import TopicExplorer from '@/components/TopicExplorer';

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Semantic Search & Topic Discovery
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12">
            Discover insights through AI-powered semantic search and topic analysis
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            <SemanticSearch />
            <TopicExplorer />
          </div>
        </div>
      </div>
    </main>
  );
}