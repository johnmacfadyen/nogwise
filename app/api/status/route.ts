import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getVectorStats } from '@/lib/simple-vectors';
import { ArchiveLogger } from '@/lib/logger';

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const then = date.getTime();
  const diffMs = now - then;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

export async function GET() {
  try {
    // Get database stats
    const messageCount = await prisma.message.count();
    const archiveCount = await prisma.archive.count();
    const wisdomCount = await prisma.wisdom.count();
    
    // Get vector store stats
    const vectorStats = await getVectorStats();
    
    // Get recent archives with message counts
    const archives = await prisma.archive.findMany({
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastFetched: 'desc' },
    });

    // Get recent log files
    const recentLogs = ArchiveLogger.getRecentLogs(3);

    return NextResponse.json({
      database: {
        messages: messageCount,
        archives: archiveCount,
        wisdom: wisdomCount,
      },
      vectors: vectorStats,
      archives: archives.map(archive => ({
        id: archive.id,
        name: archive.name,
        url: archive.url,
        messageCount: archive._count.messages,
        lastFetched: archive.lastFetched,
        lastSync: archive.lastFetched 
          ? formatRelativeTime(new Date(archive.lastFetched))
          : 'Never',
      })),
      recentLogs: recentLogs.map(logPath => ({
        path: logPath,
        name: logPath.split('/').pop(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}