import SystemStatus from '@/components/SystemStatus';

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            System Status & Diagnostics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12">
            Monitor database, vector store, and archive processing status
          </p>

          <SystemStatus />
        </div>
      </div>
    </main>
  );
}