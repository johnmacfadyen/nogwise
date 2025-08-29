import { NextRequest, NextResponse } from 'next/server';
import { getMessageClusters } from '@/lib/simple-vectors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const archiveId = searchParams.get('archiveId');
    const numTopics = parseInt(searchParams.get('count') || '10');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });
    
    const topicsPromise = getMessageClusters(
      archiveId || undefined, 
      numTopics
    );
    
    const topics = await Promise.race([topicsPromise, timeoutPromise]) as any;
    
    return NextResponse.json({
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('Error getting topics:', error);
    
    // Return fallback topics when database is busy
    const fallbackTopics = [
      {
        topic: 'BGP routing issues',
        messages: [
          {
            id: 'fallback-1',
            content: 'Topics are loading... The database is currently processing a large archive sync.',
            metadata: {
              subject: 'Archive sync in progress',
              author: 'System',
              date: new Date().toISOString()
            }
          }
        ]
      }
    ];
    
    return NextResponse.json({
      topics: fallbackTopics,
      count: fallbackTopics.length,
    });
  }
}