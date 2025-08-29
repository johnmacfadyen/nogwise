const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const { parseMboxBuffer } = require('../lib/mbox-parser-cjs.js');
const { setSyncRunning, setSyncComplete } = require('../lib/sync-status.js');

async function processFile(archiveId, filePath) {
  const prisma = new PrismaClient();
  
  try {
    console.log(`Starting background processing for archive ${archiveId}`);
    
    // Update sync status to running (in-memory)
    setSyncRunning(archiveId);
    
    console.log('Reading file from filesystem...');
    const buffer = await fs.readFile(filePath);
    console.log(`File read successfully: ${buffer.length} bytes, starting parsing...`);
    
    const messages = await parseMboxBuffer(buffer, archiveId);
    
    console.log(`Parsing completed: ${messages.length} messages processed`);
    
    // Update archive with last fetched time
    await prisma.archive.update({
      where: { id: archiveId },
      data: { lastFetched: new Date() }
    });
    
    // Mark sync as completed
    setSyncComplete(archiveId);
    
    console.log(`Processing completed successfully for archive ${archiveId}`);
    
  } catch (error) {
    console.error('Processing failed:', error);
    
    // Clear sync status on failure
    setSyncComplete(archiveId);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const archiveId = process.argv[2];
const filePath = process.argv[3];

if (!archiveId || !filePath) {
  console.error('Usage: node process-mbox.js <archiveId> <filePath>');
  process.exit(1);
}

processFile(archiveId, filePath).then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});