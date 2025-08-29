'use client';

import { useState, useEffect } from 'react';
import { Loader2, Clock, CheckCircle } from 'lucide-react';

interface SyncStatus {
  isRunning: boolean;
  archiveId?: string;
  startedAt?: string;
  progress?: {
    current: number;
    total: number;
    currentMonth?: string;
  };
}

interface SyncStatusIndicatorProps {
  archiveId: string;
  compact?: boolean;
}

export default function SyncStatusIndicator({ 
  archiveId, 
  compact = false 
}: SyncStatusIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/sync-status');
        if (response.ok) {
          const statuses = await response.json();
          setStatus(statuses[archiveId] || null);
        }
      } catch (error) {
        console.error('Error fetching sync status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    
    // Poll for status updates every 1 second (more responsive)
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, [archiveId]);

  if (loading) return null;
  
  if (!status?.isRunning) {
    return compact ? null : (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle className="w-4 h-4" />
        <span>Ready</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  const progress = status.progress;
  const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Sync in Progress
        </span>
      </div>
      
      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
            <span>
              {progress.current} of {progress.total} months
              {progress.currentMonth && ` (${progress.currentMonth})`}
            </span>
            <span>{progressPercent}%</span>
          </div>
          
          <div className="w-full bg-blue-100 dark:bg-blue-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {status.startedAt && (
        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
          <Clock className="w-3 h-3" />
          <span>Started {new Date(status.startedAt).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}