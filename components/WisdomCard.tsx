'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Calendar, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateSessionId } from '@/lib/utils';
import toast from 'react-hot-toast';
import MessageModal from './MessageModal';
import { cleanSubject } from '@/lib/subject-utils';

interface WisdomCardProps {
  wisdom: {
    id: string;
    content: string;
    votes: number;
    createdAt: string;
    messages?: Array<{
      id: string;
      subject: string;
      author: string;
      date: string;
    }>;
  };
}

export default function WisdomCard({ wisdom }: WisdomCardProps) {
  const [votes, setVotes] = useState(wisdom.votes);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVote = async (vote: number) => {
    if (isVoting) return;
    
    setIsVoting(true);
    const sessionId = generateSessionId();

    try {
      const response = await fetch(`/api/wisdom/${wisdom.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote, sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.removed) {
          setVotes(votes - vote);
          setUserVote(null);
        } else if (data.updated) {
          setVotes(votes + vote * 2);
          setUserVote(vote);
        } else {
          setVotes(votes + vote);
          setUserVote(vote);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async () => {
    const shareText = `"${wisdom.content}" - NOGWise`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard!');
    }
  };

  const handleViewMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
        <blockquote className="text-lg font-medium text-gray-900 dark:text-white mb-4 italic">
          &quot;{wisdom.content}&quot;
        </blockquote>

        {wisdom.messages && wisdom.messages.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span>Based on {wisdom.messages.length} message{wisdom.messages.length > 1 ? 's' : ''}:</span>
            </div>
            
            <div className="space-y-1">
              {wisdom.messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleViewMessage(message.id)}
                  className="block text-left w-full p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <div className="font-medium truncate">{cleanSubject(message.subject)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    by {message.author} • {format(new Date(message.date), 'MMM d, yyyy')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md transition-colors",
              userVote === 1
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{votes > 0 ? `+${votes}` : votes}</span>
          </button>

          <button
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md transition-colors",
              userVote === -1
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            )}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(wisdom.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>
      </div>

      {selectedMessageId && (
        <MessageModal
          messageId={selectedMessageId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMessageId(null);
          }}
        />
      )}
    </>
  );
}