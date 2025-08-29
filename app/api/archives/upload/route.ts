import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file || !name) {
      return NextResponse.json(
        { error: 'Missing file or name' },
        { status: 400 }
      );
    }

    // Check if archive with this name already exists
    const existingArchive = await prisma.archive.findFirst({
      where: { name }
    });

    if (existingArchive) {
      return NextResponse.json(
        { error: 'Archive with this name already exists' },
        { status: 409 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save file to filesystem
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log(`Saving uploaded file to: ${filePath}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(filePath, buffer);
    
    console.log(`File saved successfully: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Create archive record with file path
    const archive = await prisma.archive.create({
      data: {
        name,
        url: `file://${filePath}`,
        description: `Uploaded mbox file: ${file.name}`,
      }
    });

    // Start background processing using dedicated script
    console.log(`Starting background processing for archive ${archive.id}`);
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'process-mbox.js');
    const child = spawn('node', [scriptPath, archive.id, filePath], {
      detached: true,
      stdio: 'inherit'
    });
    
    child.unref(); // Allow parent process to exit

    return NextResponse.json({
      message: 'File uploaded successfully, processing in background',
      archiveId: archive.id
    });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}