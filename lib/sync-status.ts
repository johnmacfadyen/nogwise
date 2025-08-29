// Simple in-memory sync status tracker
interface SyncStatus {
  isRunning: boolean;
  archiveId?: string;
  startedAt?: Date;
  progress?: {
    current: number;
    total: number;
    currentMonth?: string;
  };
}

const syncStatuses = new Map<string, SyncStatus>();

export function setSyncRunning(archiveId: string, total?: number): void {
  syncStatuses.set(archiveId, {
    isRunning: true,
    archiveId,
    startedAt: new Date(),
    progress: total ? { current: 0, total } : undefined,
  });
}

export function updateSyncProgress(
  archiveId: string, 
  current: number, 
  currentMonth?: string
): void {
  const status = syncStatuses.get(archiveId);
  if (status && status.progress) {
    status.progress.current = current;
    status.progress.currentMonth = currentMonth;
  }
}

export function setSyncComplete(archiveId: string): void {
  syncStatuses.delete(archiveId);
}

export function getSyncStatus(archiveId: string): SyncStatus | null {
  return syncStatuses.get(archiveId) || null;
}

export function getAllSyncStatuses(): { [archiveId: string]: SyncStatus } {
  return Object.fromEntries(syncStatuses.entries());
}

export function isSyncRunning(archiveId: string): boolean {
  return syncStatuses.has(archiveId);
}