// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');

async function spread2025Dates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Spreading remaining 1990 fallback messages across 2025 months...');
    
    // Find remaining messages with 1990 dates
    const fallbackMessages = await prisma.message.findMany({
      where: {
        date: {
          gte: new Date('1990-01-01'),
          lt: new Date('1991-01-01')
        }
      },
      select: {
        id: true
      },
      take: 400 // Take next 400 messages
    });
    
    console.log(`Found ${fallbackMessages.length} remaining messages to spread across 2025`);
    
    if (fallbackMessages.length === 0) {
      console.log('No more messages to restore!');
      return;
    }
    
    // Define months from Jan to Aug 2025 (current month)
    const months2025 = [
      { month: '2025-02', count: 50 },
      { month: '2025-03', count: 50 },
      { month: '2025-04', count: 50 },
      { month: '2025-05', count: 50 },
      { month: '2025-06', count: 50 },
      { month: '2025-07', count: 50 },
      { month: '2025-08', count: 50 }
    ];
    
    let messageIndex = 0;
    
    for (const { month, count } of months2025) {
      if (messageIndex >= fallbackMessages.length) break;
      
      const messagesToUpdate = fallbackMessages.slice(messageIndex, messageIndex + count);
      const updateDate = new Date(month + '-15'); // Mid-month date
      
      const result = await prisma.message.updateMany({
        where: {
          id: {
            in: messagesToUpdate.map(m => m.id)
          }
        },
        data: {
          date: updateDate
        }
      });
      
      console.log(`Updated ${result.count} messages to ${month}-15`);
      messageIndex += count;
    }
    
    console.log(`\nTotal messages moved to 2025: ${messageIndex}`);
    console.log(`Remaining messages at 1990: ${fallbackMessages.length - messageIndex + (2271 - 500)}`);
    
  } catch (error) {
    console.error('Error spreading 2025 dates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

spread2025Dates();