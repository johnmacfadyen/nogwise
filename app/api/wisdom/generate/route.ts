import { NextRequest, NextResponse } from 'next/server';
import { WisdomGenerator } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { topic, style, messageIds } = await request.json();

    const generator = new WisdomGenerator();
    const wisdom = await generator.generateWisdom({
      topic,
      style: style || 'humorous',
      messageIds,
    });

    return NextResponse.json({ wisdom });
  } catch (error) {
    console.error('Error generating wisdom:', error);
    return NextResponse.json(
      { error: 'Failed to generate wisdom' },
      { status: 500 }
    );
  }
}