'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Zap, FileText, Play } from 'lucide-react';

interface SystemStatus {
  database: {
    messages: number;
    archives: number;
    wisdom: number;
  };
  vectors: {
    messageCount: number;
    wisdomCount: number;
    isReady: boolean;
  };
  archives: Array<{
    id: string;
    name: string;
    messageCount: number;
    lastSync: string;
  }>;
  timestamp: string;
}

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingVectorization, setIsStartingVectorization] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVectorization = async () => {
    setIsStartingVectorization(true);
    try {
      const response = await fetch('/api/vectorize/start', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Vectorization started:', result);
        alert('Vectorization process started successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to start vectorization:', error);
        alert('Failed to start vectorization: ' + error.error);
      }
    } catch (error) {
      console.error('Error starting vectorization:', error);
      alert('Error starting vectorization');
    } finally {
      setIsStartingVectorization(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading status...</div>;
  }

  if (!status) {
    return <div className="p-4 text-red-600">Failed to load status</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        System Status
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Database</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div>Messages: <span className="font-mono">{status.database.messages}</span></div>
            <div>Archives: <span className="font-mono">{status.database.archives}</span></div>
            <div>Wisdom: <span className="font-mono">{status.database.wisdom}</span></div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-300">Vector Store</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div>Message Vectors: <span className="font-mono">{status.vectors.messageCount}</span></div>
            <div>Wisdom Vectors: <span className="font-mono">{status.vectors.wisdomCount}</span></div>
            <div className="flex items-center gap-1">
              <span>AI Ready:</span>
              <span className={`font-mono ${status.vectors.isReady ? 'text-green-600' : 'text-red-600'}`}>
                {status.vectors.isReady ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={startVectorization}
              disabled={isStartingVectorization}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs rounded-md transition-colors"
            >
              <Play className="w-3 h-3" />
              {isStartingVectorization ? 'Starting...' : 'Start Vectorization'}
            </button>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-300">Status</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div>Vectorization Rate: 
              <span className="font-mono ml-1">
                {status.vectors.messageCount > 0 
                  ? `${Math.round((status.vectors.messageCount / status.database.messages) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
            <div>Last Update: 
              <span className="font-mono ml-1">
                {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Archives</h3>
        <div className="space-y-2">
          {status.archives.map((archive) => (
            <div
              key={archive.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {archive.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  ({archive.messageCount} messages)
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {archive.lastSync}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        🔄 Auto-refreshes every 10 seconds
      </div>
    </div>
  );
}