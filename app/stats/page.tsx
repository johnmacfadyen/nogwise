'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Users, Calendar, Hash, TrendingUp, BarChart3, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Archive {
  id: string;
  name: string;
}

interface ArchiveStats {
  totalMessages: number;
  totalAuthors: number;
  topAuthors: Array<{ author: string; messageCount: number }>;
  topSubjectTerms: Array<{ term: string; count: number }>;
  monthlyTimeline: Array<{ month: string; count: number }>;
  yearlyTimeline: Array<{ year: string; count: number }>;
  dateRange: { earliest: string; latest: string };
}

export default function StatsPage() {
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArchives();
  }, []);

  useEffect(() => {
    if (archives.length > 0) {
      fetchStats();
    }
  }, [selectedArchive, archives]);

  const fetchArchives = async () => {
    try {
      const response = await fetch('/api/archives');
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const url = selectedArchive 
        ? `/api/archives/stats?archiveId=${selectedArchive}`
        : '/api/archives/stats';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              📊 Archive Statistics
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Comprehensive insights into your mailing list archives
            </p>
            
            {/* Archive Filter */}
            {archives.length > 0 && (
              <div className="flex items-center justify-center gap-3 mb-6">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <select
                  value={selectedArchive}
                  onChange={(e) => setSelectedArchive(e.target.value)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Archives Combined</option>
                  {archives.map((archive) => (
                    <option key={archive.id} value={archive.id}>
                      {archive.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {stats && (
            <>
              {/* Current Filter Indicator */}
              {selectedArchive && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 dark:text-blue-200 text-center">
                    📊 Showing statistics for: <strong>{archives.find(a => a.id === selectedArchive)?.name}</strong>
                  </p>
                </div>
              )}
              
              {/* Key Metrics */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalMessages.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Total Messages</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
                  <Users className="w-12 h-12 mx-auto text-green-600 mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalAuthors.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Unique Authors</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-purple-600 mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {format(new Date(stats.dateRange.earliest), 'yyyy')} - {format(new Date(stats.dateRange.latest), 'yyyy')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Date Range</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
                  <Hash className="w-12 h-12 mx-auto text-orange-600 mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.round(stats.totalMessages / stats.totalAuthors)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Avg Messages/Author</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Top Contributors */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Contributors
                  </h2>
                  <div className="space-y-3">
                    {stats.topAuthors.slice(0, 15).map((author, index) => (
                      <div key={author.author} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-4">
                          <span className="inline-block w-6 text-gray-500">#{index + 1}</span>
                          {author.author}
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 min-w-[60px] text-right">
                          {author.messageCount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Topics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Common Discussion Topics
                  </h2>
                  <div className="space-y-3">
                    {stats.topSubjectTerms.slice(0, 15).map((term, index) => {
                      const maxCount = stats.topSubjectTerms[0].count;
                      const percentage = (term.count / maxCount) * 100;
                      
                      return (
                        <div key={term.term} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {term.term}
                            </span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {term.count}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              {(stats.yearlyTimeline.length > 0 || stats.monthlyTimeline.length > 0) && (
                <div className="mt-8 space-y-8">
                  {/* Yearly Overview */}
                  {stats.yearlyTimeline.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Activity Timeline - Yearly Overview
                      </h2>
                      <div className="w-full">
                        <div className="flex gap-1 w-full pb-2">
                          {stats.yearlyTimeline.map((year) => {
                            const maxCount = Math.max(...stats.yearlyTimeline.map(y => y.count));
                            const height = (year.count / maxCount) * 100;
                            const yearCount = stats.yearlyTimeline.length;
                            // Calculate dynamic width based on available space
                            const maxBarWidth = yearCount > 20 ? '20px' : yearCount > 15 ? '28px' : yearCount > 10 ? '36px' : '48px';
                            const fontSize = yearCount > 20 ? 'text-xs' : yearCount > 15 ? 'text-xs' : 'text-sm';
                            
                            return (
                              <div key={year.year} className="flex flex-col items-center flex-1 min-w-0">
                                <div className={`${fontSize} text-gray-500 dark:text-gray-400 mb-1 font-medium truncate w-full text-center`}>
                                  {year.count > 999 ? `${Math.round(year.count/1000)}k` : year.count}
                                </div>
                                <div 
                                  className="bg-gray-200 dark:bg-gray-700 rounded-t relative mx-auto" 
                                  style={{ 
                                    height: '140px', 
                                    width: `min(${maxBarWidth}, 100%)`,
                                    maxWidth: maxBarWidth 
                                  }}
                                >
                                  <div 
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                                    style={{ height: `${height}%` }}
                                    title={`${year.year}: ${year.count.toLocaleString()} messages`}
                                  />
                                </div>
                                <div className={`${fontSize} text-gray-700 dark:text-gray-300 mt-2 font-medium truncate w-full text-center`}>
                                  {yearCount > 25 ? year.year.slice(-2) : year.year}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Complete yearly activity from {stats.yearlyTimeline[0]?.year} to {stats.yearlyTimeline[stats.yearlyTimeline.length - 1]?.year}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Peak activity: {Math.max(...stats.yearlyTimeline.map(y => y.count)).toLocaleString()} messages in {stats.yearlyTimeline.find(y => y.count === Math.max(...stats.yearlyTimeline.map(y2 => y2.count)))?.year}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Monthly Detail */}
                  {stats.monthlyTimeline.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Recent Monthly Activity
                      </h2>
                      <div className="w-full">
                        <div className="flex justify-between gap-1 w-full pb-2">
                          {(() => {
                            // Get last 24 months (API already filters out 1990 fallback dates)
                            const recentMonths = stats.monthlyTimeline.slice(-24);
                            
                            return recentMonths.map((month) => {
                              const maxCount = Math.max(...recentMonths.map(m => m.count));
                            const height = (month.count / maxCount) * 100;
                            
                            return (
                              <div key={month.month} className="flex flex-col items-center flex-1">
                                <div className="w-full max-w-8 bg-gray-200 dark:bg-gray-700 rounded-t relative mx-auto" style={{ height: '100px' }}>
                                  <div 
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t transition-all duration-300 hover:opacity-80"
                                    style={{ height: `${height}%` }}
                                    title={`${format(new Date(month.month + '-01'), 'MMM yyyy')}: ${month.count} messages`}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-center">
                                  {format(new Date(month.month + '-01'), 'MMM yy')}
                                </div>
                              </div>
                            );
                            });
                          })()}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                          Recent 24 months of detailed activity
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}