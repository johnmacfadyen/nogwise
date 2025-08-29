import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    console.log('Starting manual vectorization...');
    
    // Spawn the vectorization script as a background process
    const scriptPath = path.join(process.cwd(), 'scripts', 'vectorize-messages.js');
    
    const vectorizeProcess = spawn('node', [scriptPath], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Detach the process so it continues running even if the API request ends
    vectorizeProcess.unref();
    
    console.log(`Vectorization process started with PID: ${vectorizeProcess.pid}`);
    
    return NextResponse.json({
      success: true,
      message: 'Vectorization process started successfully',
      pid: vectorizeProcess.pid
    });
    
  } catch (error) {
    console.error('Error starting vectorization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start vectorization process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}