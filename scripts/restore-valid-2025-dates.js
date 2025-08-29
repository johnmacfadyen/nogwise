// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');

async function restoreValid2025Dates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Finding messages with 1990 fallback dates that should be 2025...');
    
    // Find messages with 1990 dates - these were moved from future dates
    const fallbackMessages = await prisma.message.findMany({
      where: {
        date: {
          gte: new Date('1990-01-01'),
          lt: new Date('1991-01-01')
        }
      },
      select: {
        id: true,
        messageId: true,
        subject: true,
        date: true
      }
    });
    
    console.log(`Found ${fallbackMessages.length} messages with 1990 fallback dates`);
    
    if (fallbackMessages.length === 0) {
      console.log('No messages to restore!');
      return;
    }
    
    // Since we can't reliably reconstruct the original dates, let's be conservative
    // and only restore messages that we can reasonably assume are from 2025
    // We'll set them to a generic 2025 date rather than trying to guess the exact date
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based
    
    console.log(`Current date: ${currentDate.toISOString()}`);
    console.log(`We can safely restore dates up to: ${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    
    // For now, let's restore some of these to January 2025 as a reasonable assumption
    // that these are legitimate 2025 messages that got caught in the future date fix
    
    const restoreDate = new Date('2025-01-15'); // Mid-January 2025 as a safe restore point
    const messagesToRestore = Math.min(fallbackMessages.length, 100); // Restore first 100 as a test
    
    console.log(`Restoring ${messagesToRestore} messages to ${restoreDate.toISOString()}`);
    
    // Update first batch to 2025-01-15
    const result = await prisma.message.updateMany({
      where: {
        id: {
          in: fallbackMessages.slice(0, messagesToRestore).map(m => m.id)
        }
      },
      data: {
        date: restoreDate
      }
    });
    
    console.log(`Restored ${result.count} messages to 2025-01-15`);
    
    // Show some examples
    console.log('\nSample of restored messages:');
    fallbackMessages.slice(0, 5).forEach(msg => {
      console.log(`- ${msg.subject} (restored from 1990 to 2025-01-15)`);
    });
    
    console.log(`\nRemaining ${fallbackMessages.length - messagesToRestore} messages still at 1990 fallback date`);
    
  } catch (error) {
    console.error('Error restoring valid 2025 dates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreValid2025Dates();