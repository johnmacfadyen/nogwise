import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '20');

    let orderBy: any = { createdAt: 'desc' };
    let where: any = {};

    switch (filter) {
      case 'top':
        orderBy = { votes: 'desc' };
        break;
      case 'featured':
        where = { featured: true };
        orderBy = { votes: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const wisdom = await prisma.wisdom.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        messages: {
          select: {
            id: true,
            subject: true,
            author: true,
            date: true,
          },
        },
      },
    });

    return NextResponse.json(wisdom);
  } catch (error) {
    console.error('Error fetching wisdom:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wisdom' },
      { status: 500 }
    );
  }
}