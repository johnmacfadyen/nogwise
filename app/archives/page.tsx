import ArchiveManager from '@/components/ArchiveManager';

export default function ArchivesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Archive Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12">
            Add and manage mailing list archives to extract wisdom from
          </p>
          <ArchiveManager />
        </div>
      </div>
    </main>
  );
}