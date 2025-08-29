'use client';

import { useState } from 'react';
import { Search, Loader2, MessageCircle, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cleanSubject } from '@/lib/subject-utils';

interface SearchResult {
  id: string;
  content: string;
  metadata: {
    messageId: string;
    subject: string;
    author: string;
    date: string;
    archiveId: string;
  };
}

export default function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setHasSearched(true);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Make sure you have messages in the database.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        🔍 Semantic Search
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Search messages by meaning, not just keywords. Try queries like:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            'BGP routing problems',
            'DNS configuration issues', 
            'network outages',
            'IPv6 deployment challenges',
            'peering agreements'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What are you looking for? (e.g., 'routing table corruption', 'fiber cuts')"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isSearching}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </div>

      {isSearching && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}

      {hasSearched && !isSearching && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Search Results ({results.length})
            </h3>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages found for &quot;{query}&quot;</p>
              <p className="text-sm mt-2">
                Try a different search term or make sure you have archives synced.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                      {cleanSubject(result.metadata.subject)}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{result.metadata.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(result.metadata.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {truncateContent(result.content)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}