import { NextRequest, NextResponse } from 'next/server';
import { searchMessages } from '@/lib/simple-vectors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await searchMessages(query, limit);
    
    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}