import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { vote, sessionId } = await request.json();

    if (!sessionId || (vote !== 1 && vote !== -1)) {
      return NextResponse.json(
        { error: 'Invalid vote data' },
        { status: 400 }
      );
    }

    const existingVote = await prisma.wisdomVote.findUnique({
      where: {
        wisdomId_sessionId: {
          wisdomId: params.id,
          sessionId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.vote === vote) {
        await prisma.wisdomVote.delete({
          where: { id: existingVote.id },
        });
        
        await prisma.wisdom.update({
          where: { id: params.id },
          data: { votes: { decrement: vote } },
        });

        return NextResponse.json({ removed: true });
      } else {
        await prisma.wisdomVote.update({
          where: { id: existingVote.id },
          data: { vote },
        });

        await prisma.wisdom.update({
          where: { id: params.id },
          data: { votes: { increment: vote * 2 } },
        });

        return NextResponse.json({ updated: true });
      }
    } else {
      await prisma.wisdomVote.create({
        data: {
          wisdomId: params.id,
          sessionId,
          vote,
        },
      });

      await prisma.wisdom.update({
        where: { id: params.id },
        data: { votes: { increment: vote } },
      });

      return NextResponse.json({ created: true });
    }
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}