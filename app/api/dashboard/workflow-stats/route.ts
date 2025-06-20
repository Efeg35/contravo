import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for now, you can later replace with actual database queries
    const stats = {
      total: 10590,
      inProgress: 7907,
      assignedToMe: 71,
      participating: 87,
      completed: 1803,
      overdue: 24,
      expiringSoon: 15
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 