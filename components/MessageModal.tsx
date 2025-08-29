'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Archive, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { cleanSubject } from '@/lib/subject-utils';

interface Message {
  id: string;
  subject: string;
  author: string;
  content: string;
  date: string;
  messageId: string;
  archive: {
    name: string;
    url: string;
  };
}

interface MessageModalProps {
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageModal({ messageId, isOpen, onClose }: MessageModalProps) {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && messageId) {
      fetchMessage();
    }
  }, [isOpen, messageId]);

  const fetchMessage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/messages/${messageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch message');
      }
      const data = await response.json();
      setMessage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Source Message
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {message && (
            <div className="space-y-4">
              {/* Message Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {cleanSubject(message.subject)}
                </h3>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{message.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(message.date), 'PPP')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    <span>{message.archive.name}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
                  {message.content}
                </div>
              </div>

              {/* Archive Link */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <a
                  href={message.archive.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View in original archive
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}