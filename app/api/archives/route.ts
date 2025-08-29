import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ArchiveScraper } from '@/lib/scraper';

export async function GET() {
  try {
    const archives = await prisma.archive.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(archives);
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, name } = await request.json();

    if (!url || !name) {
      return NextResponse.json(
        { error: 'URL and name are required' },
        { status: 400 }
      );
    }

    const existingArchive = await prisma.archive.findUnique({
      where: { url },
    });

    if (existingArchive) {
      return NextResponse.json(
        { error: 'Archive already exists' },
        { status: 409 }
      );
    }

    const archive = await prisma.archive.create({
      data: {
        url,
        name,
        description: `Mailing list archive for ${name}`,
      },
    });

    const scraper = new ArchiveScraper(url);
    scraper.syncArchive(url, name).catch(console.error);

    return NextResponse.json(archive);
  } catch (error) {
    console.error('Error creating archive:', error);
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    );
  }
}