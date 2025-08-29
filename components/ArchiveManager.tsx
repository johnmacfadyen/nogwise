'use client';

import { useState, useEffect } from 'react';
import { Plus, Archive, RefreshCw, Loader2, ExternalLink, Upload, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SyncStatusIndicator from './SyncStatusIndicator';

interface Archive {
  id: string;
  name: string;
  url: string;
  description: string | null;
  lastFetched: string | null;
  createdAt: string;
  _count: {
    messages: number;
  };
}

export default function ArchiveManager() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newArchive, setNewArchive] = useState({ name: '', url: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const response = await fetch('/api/archives');
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
      toast.error('Failed to load archives');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArchive = async () => {
    if (!newArchive.name || !newArchive.url) {
      toast.error('Please provide both name and URL');
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArchive),
      });

      if (response.ok) {
        toast.success('Archive added! Syncing messages in background...');
        setNewArchive({ name: '', url: '' });
        setShowAddForm(false);
        fetchArchives();
      } else if (response.status === 409) {
        toast.error('This archive already exists');
      } else {
        throw new Error('Failed to add archive');
      }
    } catch (error) {
      console.error('Error adding archive:', error);
      toast.error('Failed to add archive');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUploadMbox = async () => {
    if (!uploadFile || !uploadName) {
      toast.error('Please provide both a name and select an mbox file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);

      const response = await fetch('/api/archives/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Mbox file uploaded and processing started!');
        setUploadName('');
        setUploadFile(null);
        setShowUploadForm(false);
        fetchArchives();
      } else if (response.status === 409) {
        toast.error('An archive with this name already exists');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading mbox:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSync = async (archiveId: string) => {
    setSyncingId(archiveId);

    try {
      const response = await fetch(`/api/archives/${archiveId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Sync started in background');
        // Immediately refresh to show sync status
        fetchArchives();
      } else if (response.status === 409) {
        toast.error('Sync already running for this archive');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync');
      }
    } catch (error) {
      console.error('Error syncing archive:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync archive');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (archiveId: string, archiveName: string) => {
    if (!confirm(`Are you sure you want to delete "${archiveName}"? This will remove all messages and cannot be undone.`)) {
      return;
    }

    setDeletingId(archiveId);

    try {
      const response = await fetch(`/api/archives/${archiveId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Archive deleted successfully');
        fetchArchives();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete archive');
      }
    } catch (error) {
      console.error('Error deleting archive:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete archive');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Mailing List Archives
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setShowAddForm(false);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Mbox
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowUploadForm(false);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add URL
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Add New Archive
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newArchive.name}
                onChange={(e) => setNewArchive({ ...newArchive, name: e.target.value })}
                placeholder="e.g., AusNOG"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Archive URL
              </label>
              <input
                type="url"
                value={newArchive.url}
                onChange={(e) => setNewArchive({ ...newArchive, url: e.target.value })}
                placeholder="https://lists.ausnog.net/pipermail/ausnog/"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddArchive}
              disabled={isAdding}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Archive'
              )}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showUploadForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Upload Mbox File
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Archive Name
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g., NANOG"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mbox File
              </label>
              <input
                type="file"
                accept=".mbox,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select an mbox format file to upload and parse
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUploadMbox}
              disabled={isUploading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Process
                </>
              )}
            </button>
            <button
              onClick={() => setShowUploadForm(false)}
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : archives.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No archives added yet. Add your first mailing list archive to get started!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Try adding: https://lists.ausnog.net/pipermail/ausnog/
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {archives.map((archive) => (
            <div
              key={archive.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {archive.name}
                  </h3>
                  <a
                    href={archive.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    {archive.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{archive._count.messages} messages</span>
                    {archive.lastFetched && (
                      <span>
                        Last synced: {format(new Date(archive.lastFetched), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <SyncStatusIndicator archiveId={archive.id} compact />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(archive.id)}
                    disabled={syncingId === archive.id || deletingId === archive.id}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                    title="Sync archive"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${syncingId === archive.id ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(archive.id, archive.name)}
                    disabled={syncingId === archive.id || deletingId === archive.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                    title="Delete archive"
                  >
                    {deletingId === archive.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}