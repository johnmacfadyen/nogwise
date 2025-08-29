import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const archiveId = searchParams.get('archiveId');
    
    // Get basic message stats
    const messageStats = await prisma.message.aggregate({
      where: archiveId ? { archiveId } : {},
      _count: true,
    });

    // Get total unique author count
    const uniqueAuthorCount = await prisma.message.findMany({
      where: archiveId ? { archiveId } : {},
      select: { author: true },
      distinct: ['author']
    });

    // Get top author stats
    const authorStats = await prisma.message.groupBy({
      by: ['author'],
      where: archiveId ? { archiveId } : {},
      _count: true,
      orderBy: {
        _count: {
          author: 'desc'
        }
      },
      take: 20
    });

    // Get timeline data from all messages
    const timelineMessages = await prisma.message.findMany({
      where: archiveId ? { archiveId } : {},
      select: { date: true },
      orderBy: { date: 'asc' }
    });

    // Get subject word frequency (sample for performance)
    const messages = await prisma.message.findMany({
      where: archiveId ? { archiveId } : {},
      select: { subject: true, date: true },
      orderBy: { date: 'desc' },
      take: 1000 // Sample for performance
    });

    // Process timeline data from all messages
    const monthlyStats = new Map<string, number>();
    const yearlyStats = new Map<string, number>();
    
    timelineMessages.forEach(msg => {
      const month = msg.date.toISOString().slice(0, 7);
      const year = msg.date.toISOString().slice(0, 4);
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
      yearlyStats.set(year, (yearlyStats.get(year) || 0) + 1);
    });

    // Process subjects for common terms (from sample)
    const subjectWords = new Map<string, number>();
    
    messages.forEach(msg => {
      
      // Skip messages with no meaningful subject
      if (!msg.subject || 
          msg.subject.toLowerCase().includes('no subject') ||
          msg.subject.toLowerCase().includes('email found in subject') ||
          msg.subject.trim().length < 3) {
        return;
      }
      
      // Extract meaningful words from subjects
      const words = msg.subject
        .toLowerCase()
        .replace(/\[ausnog\]|\[.*?\]/g, '') // Remove mailing list tags
        .replace(/re:|fwd:|fw:|subject:/g, '') // Remove reply prefixes and "subject:"
        .replace(/email found in subject/g, '') // Remove parsing artifacts
        .replace(/[^\w\s]/g, ' ') // Remove punctuation, replace with spaces
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          word.match(/^[a-zA-Z]+$/) && // Only include words with letters only
          !['with', 'from', 'have', 'this', 'that', 'will', 'been', 'were', 'they', 'them', 'when', 'what', 'where', 'about', 'would', 'could', 'should', 'subject', 'email', 'found'].includes(word)
        );
      
      words.forEach(word => {
        subjectWords.set(word, (subjectWords.get(word) || 0) + 1);
      });
    });

    // Get top subject terms
    const topSubjectTerms = Array.from(subjectWords.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([term, count]) => ({ 
        term: term.charAt(0).toUpperCase() + term.slice(1), // Capitalize first letter
        count 
      }));

    // Get monthly and yearly timelines
    const monthlyTimeline = Array.from(monthlyStats.entries())
      .filter(([month]) => !month.startsWith('1990')) // Filter out fallback dates
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
      
    const yearlyTimeline = Array.from(yearlyStats.entries())
      .filter(([year]) => year !== '1990') // Filter out fallback dates
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }));

    // Get date range (excluding 1990 fallback dates)
    const dateRange = await prisma.message.aggregate({
      where: {
        ...(archiveId ? { archiveId } : {}),
        date: {
          gt: new Date('1991-01-01') // Exclude 1990 fallback dates
        }
      },
      _min: { date: true },
      _max: { date: true }
    });

    // Get thread stats
    const threadStats = await prisma.message.groupBy({
      by: ['threadId'],
      where: { 
        ...(archiveId ? { archiveId } : {}),
        threadId: { not: null }
      },
      _count: true,
      orderBy: {
        _count: {
          threadId: 'desc'
        }
      },
      take: 10
    });

    return NextResponse.json({
      totalMessages: messageStats._count,
      totalAuthors: uniqueAuthorCount.length,
      topAuthors: authorStats.map(a => ({
        author: a.author,
        messageCount: a._count
      })),
      topSubjectTerms,
      monthlyTimeline,
      yearlyTimeline,
      dateRange: {
        earliest: dateRange._min.date,
        latest: dateRange._max.date
      },
      topThreads: threadStats.map(t => ({
        threadId: t.threadId,
        messageCount: t._count
      }))
    });
  } catch (error) {
    console.error('Error getting archive stats:', error);
    return NextResponse.json(
      { error: 'Failed to get archive statistics' },
      { status: 500 }
    );
  }
}