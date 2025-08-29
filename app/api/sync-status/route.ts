import { NextResponse } from 'next/server';
import { getAllSyncStatuses } from '@/lib/sync-status';

export async function GET() {
  try {
    const statuses = getAllSyncStatuses();
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}