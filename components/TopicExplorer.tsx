'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cleanSubject } from '@/lib/subject-utils';

interface Topic {
  topic: string;
  messages: Array<{
    id: string;
    content: string;
    metadata: {
      subject: string;
      author: string;
      date: string;
    };
  }>;
}

export default function TopicExplorer() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics?count=8');
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics);
      } else {
        throw new Error('Failed to fetch topics');
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWisdom = async (topic: string) => {
    try {
      const response = await fetch('/api/wisdom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style: 'humorous' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Wisdom generated!');
        // You might want to emit an event or call a callback here
      } else {
        throw new Error('Failed to generate wisdom');
      }
    } catch (error) {
      console.error('Error generating wisdom:', error);
      toast.error('Failed to generate wisdom');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        📊 Topic Explorer
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Discover the most discussed topics in your mailing list archives using AI clustering.
      </p>

      {topics.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No topics discovered yet</p>
          <p className="text-sm">Add some archives and let them sync to see topics emerge!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((topicData) => (
            <div
              key={topicData.topic}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedTopic(
                selectedTopic === topicData.topic ? null : topicData.topic
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {topicData.topic}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-4 h-4" />
                  <span>{topicData.messages.length}</span>
                </div>
              </div>

              {selectedTopic === topicData.topic && (
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {topicData.messages.slice(0, 10).map((message, index) => (
                      <div key={message.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {cleanSubject(message.metadata.subject)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                          by {message.metadata.author} • {format(new Date(message.metadata.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">
                          {message.content.length > 100 
                            ? message.content.substring(0, 100) + '...' 
                            : message.content
                          }
                        </p>
                      </div>
                    ))}
                    {topicData.messages.length > 10 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        Showing 10 of {topicData.messages.length} messages
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateWisdom(topicData.topic);
                    }}
                    className="w-full mt-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-2 px-4 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                  >
                    Generate Wisdom for this Topic
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}