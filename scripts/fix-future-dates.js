// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');

async function fixFutureDates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Finding messages with future dates...');
    
    // Find messages with dates in the future (after 2025)
    const futureMessages = await prisma.message.findMany({
      where: {
        date: {
          gte: new Date('2025-01-01')
        }
      },
      select: {
        id: true,
        messageId: true,
        subject: true,
        date: true
      }
    });
    
    console.log(`Found ${futureMessages.length} messages with future dates`);
    
    if (futureMessages.length === 0) {
      console.log('No messages to fix!');
      return;
    }
    
    // Update them to use the fallback date
    const fallbackDate = new Date('1990-01-01');
    
    console.log(`Updating ${futureMessages.length} messages to fallback date: ${fallbackDate.toISOString()}`);
    
    const result = await prisma.message.updateMany({
      where: {
        date: {
          gte: new Date('2025-01-01')
        }
      },
      data: {
        date: fallbackDate
      }
    });
    
    console.log(`Updated ${result.count} messages successfully`);
    
    // Show some examples of what was fixed
    console.log('\nSample of fixed messages:');
    futureMessages.slice(0, 5).forEach(msg => {
      console.log(`- ${msg.subject} (was: ${msg.date.toISOString()})`);
    });
    
  } catch (error) {
    console.error('Error fixing future dates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixFutureDates();