// Simple in-memory sync status tracker (CommonJS version)
const syncStatuses = new Map();

function setSyncRunning(archiveId, total) {
  syncStatuses.set(archiveId, {
    isRunning: true,
    archiveId,
    startedAt: new Date(),
    progress: total ? { current: 0, total } : undefined,
  });
}

function updateSyncProgress(archiveId, current, currentMonth) {
  const status = syncStatuses.get(archiveId);
  if (status && status.progress) {
    status.progress.current = current;
    status.progress.currentMonth = currentMonth;
  }
}

function setSyncComplete(archiveId) {
  syncStatuses.delete(archiveId);
}

function getSyncStatus(archiveId) {
  return syncStatuses.get(archiveId) || null;
}

function getAllSyncStatuses() {
  return Object.fromEntries(syncStatuses.entries());
}

function isSyncRunning(archiveId) {
  return syncStatuses.has(archiveId);
}

module.exports = {
  setSyncRunning,
  updateSyncProgress,
  setSyncComplete,
  getSyncStatus,
  getAllSyncStatuses,
  isSyncRunning
};