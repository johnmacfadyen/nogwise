'use client';

import { useState, useEffect } from 'react';
import WisdomCard from '@/components/WisdomCard';
import WisdomGenerator from '@/components/WisdomGenerator';
import { Loader2, TrendingUp, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const filters = [
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'top', label: 'Top Rated', icon: TrendingUp },
  { value: 'featured', label: 'Featured', icon: Star },
];

export default function WisdomPage() {
  const [wisdomList, setWisdomList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('recent');

  useEffect(() => {
    fetchWisdom();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWisdom = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wisdom?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setWisdomList(data);
      }
    } catch (error) {
      console.error('Error fetching wisdom:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Words of Wisdom
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12">
            Generate and explore humorous wisdom from network operator discussions
          </p>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex gap-2 mb-6">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                      filter === f.value
                        ? "bg-purple-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <f.icon className="w-4 h-4" />
                    {f.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : wisdomList.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No wisdom generated yet. Try generating some!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Make sure you&apos;ve added some archives first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wisdomList.map((wisdom) => (
                    <WisdomCard key={wisdom.id} wisdom={wisdom} />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <WisdomGenerator />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}