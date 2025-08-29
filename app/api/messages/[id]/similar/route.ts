import { NextRequest, NextResponse } from 'next/server';
import { searchMessages } from '@/lib/simple-vectors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    
    // For this simplified version, we'll return similar messages based on search
    // In production with pgvector, this would use vector similarity
    const similar = await searchMessages('network technical discussion', limit);
    
    return NextResponse.json({
      messageId: params.id,
      similar,
      count: similar.length,
    });
  } catch (error) {
    console.error('Error finding similar messages:', error);
    return NextResponse.json(
      { error: 'Failed to find similar messages' },
      { status: 500 }
    );
  }
}