import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ArchiveScraper } from '@/lib/scraper';
import { isSyncRunning, setSyncRunning } from '@/lib/sync-status';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if sync is already running for this archive
    if (isSyncRunning(id)) {
      return NextResponse.json(
        { error: 'Sync already running for this archive' },
        { status: 409 }
      );
    }
    
    const archive = await prisma.archive.findUnique({
      where: { id },
    });

    if (!archive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      );
    }

    // Mark sync as running
    setSyncRunning(id);
    
    const scraper = new ArchiveScraper(archive.url);
    scraper.syncArchive(archive.url, archive.name).catch(console.error);

    return NextResponse.json({ message: 'Sync started' });
  } catch (error) {
    console.error('Error syncing archive:', error);
    return NextResponse.json(
      { error: 'Failed to sync archive' },
      { status: 500 }
    );
  }
}