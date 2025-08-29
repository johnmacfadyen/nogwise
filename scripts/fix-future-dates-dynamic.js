// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');

async function fixFutureDatesDynamic() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Finding messages with future dates (dynamic check)...');
    
    // Use current date + 1 year as the cutoff for "future" dates
    // This allows for some clock skew and time zone differences
    const today = new Date();
    const futureThreshold = new Date(today);
    futureThreshold.setFullYear(today.getFullYear() + 1); // 1 year from now
    
    console.log(`Current date: ${today.toISOString()}`);
    console.log(`Future threshold (1 year from now): ${futureThreshold.toISOString()}`);
    
    // Find messages with dates after the threshold
    const futureMessages = await prisma.message.findMany({
      where: {
        date: {
          gt: futureThreshold
        }
      },
      select: {
        id: true,
        messageId: true,
        subject: true,
        date: true
      }
    });
    
    console.log(`Found ${futureMessages.length} messages with invalid future dates`);
    
    if (futureMessages.length === 0) {
      console.log('No messages to fix!');
      return;
    }
    
    // Show some examples
    console.log('\nSample of messages with future dates:');
    futureMessages.slice(0, 5).forEach(msg => {
      console.log(`- ${msg.subject} (date: ${msg.date.toISOString()})`);
    });
    
    // Update them to use the fallback date
    const fallbackDate = new Date('1990-01-01');
    
    console.log(`\nUpdating ${futureMessages.length} messages to fallback date: ${fallbackDate.toISOString()}`);
    
    const result = await prisma.message.updateMany({
      where: {
        date: {
          gt: futureThreshold
        }
      },
      data: {
        date: fallbackDate
      }
    });
    
    console.log(`Updated ${result.count} messages successfully`);
    
  } catch (error) {
    console.error('Error fixing future dates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixFutureDatesDynamic();