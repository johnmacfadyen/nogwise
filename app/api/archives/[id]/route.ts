import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { promises as fs } from 'fs';
import { setSyncComplete } from '@/lib/sync-status';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the archive to check if it has an uploaded file
    const archive = await prisma.archive.findUnique({
      where: { id }
    });
    
    if (!archive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      );
    }
    
    // Delete associated data in correct order due to foreign key constraints
    console.log(`Deleting archive ${id}: ${archive.name}`);
    
    // First get all message IDs for this archive
    const messages = await prisma.message.findMany({
      where: { archiveId: id },
      select: { messageId: true }
    });
    
    const messageIds = messages.map(m => m.messageId);
    
    // Delete message vectors using messageId
    if (messageIds.length > 0) {
      await prisma.messageVector.deleteMany({
        where: {
          messageId: {
            in: messageIds
          }
        }
      });
      console.log(`Deleted ${messageIds.length} message vectors`);
    }
    
    // Delete messages
    const deletedMessages = await prisma.message.deleteMany({
      where: { archiveId: id }
    });
    console.log(`Deleted ${deletedMessages.count} messages`);
    
    // Clear in-memory sync status
    setSyncComplete(id);
    
    // Delete the archive itself
    await prisma.archive.delete({
      where: { id }
    });
    
    // If this was an uploaded file, try to delete the file from filesystem
    if (archive.url.startsWith('file://')) {
      try {
        const filePath = archive.url.replace('file://', '');
        await fs.unlink(filePath);
        console.log(`Deleted uploaded file: ${filePath}`);
      } catch (fileError) {
        console.warn(`Could not delete uploaded file: ${fileError.message}`);
        // Don't fail the whole operation if file deletion fails
      }
    }
    
    console.log(`Successfully deleted archive ${id}`);
    
    return NextResponse.json({
      message: 'Archive deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting archive:', error);
    return NextResponse.json(
      { error: 'Failed to delete archive' },
      { status: 500 }
    );
  }
}