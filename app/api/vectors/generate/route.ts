import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { prisma } from '@/lib/db';
import { isAIReady } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const { background = true } = await request.json().catch(() => ({}));
    
    // Check if AI is ready
    if (!await isAIReady()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'AI provider not ready',
          details: 'OpenAI API key not configured or invalid'
        },
        { status: 400 }
      );
    }
    
    // Get count of messages without vectors
    const missingCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM Message m
      LEFT JOIN MessageVector mv ON m.messageId = mv.messageId
      WHERE mv.messageId IS NULL
    `;
    
    const totalMissing = Number(missingCount[0].count);
    
    if (totalMissing === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missing vectors to generate',
        missingCount: 0
      });
    }
    
    console.log(`Found ${totalMissing} messages without vectors`);
    
    if (background) {
      // Start background vectorization process
      console.log('Starting background vectorization process...');
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'vectorize-messages.js');
      const child = spawn('node', [scriptPath], {
        detached: true,
        stdio: 'inherit'
      });
      
      child.unref(); // Allow parent process to exit
      
      return NextResponse.json({
        success: true,
        message: `Background vectorization started for ${totalMissing} messages`,
        missingCount: totalMissing,
        mode: 'background'
      });
    } else {
      // For small datasets, could do synchronous processing
      return NextResponse.json({
        success: false,
        error: 'Synchronous vectorization not implemented for large datasets',
        details: 'Use background=true for large datasets'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in vector generation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to start vector generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}