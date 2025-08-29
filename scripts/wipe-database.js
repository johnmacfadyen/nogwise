// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

async function wipeDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Wiping database...');
    
    // Delete all data in reverse dependency order
    console.log('Deleting message vectors...');
    const deletedVectors = await prisma.messageVector.deleteMany({});
    console.log(`Deleted ${deletedVectors.count} message vectors`);
    
    console.log('Deleting messages...');
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`Deleted ${deletedMessages.count} messages`);
    
    console.log('Deleting archives...');
    const deletedArchives = await prisma.archive.deleteMany({});
    console.log(`Deleted ${deletedArchives.count} archives`);
    
    // Clean up upload directory
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
      const files = await fs.readdir(uploadDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(uploadDir, file));
          console.log(`Deleted upload file: ${file}`);
        }
      }
    } catch (error) {
      console.log('Upload directory already clean or doesn\'t exist');
    }
    
    console.log('\n✅ Database wiped successfully!');
    console.log('You can now re-import your archives with corrected date parsing.');
    
  } catch (error) {
    console.error('Error wiping database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();