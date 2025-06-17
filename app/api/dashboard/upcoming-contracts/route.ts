import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date and 90 days from now
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    // Fetch upcoming contracts
    const upcomingContracts = await prisma.contract.findMany({
      where: {
        expirationDate: {
          not: null,
          gte: today, // From today onwards
          lte: ninetyDaysFromNow // Within 90 days
        }
      },
      select: {
        id: true,
        title: true,
        expirationDate: true,
        noticePeriodDays: true
      },
      orderBy: {
        expirationDate: 'asc' // Closest dates first
      },
      take: 5 // Limit to 5 results
    });

    return NextResponse.json({ contracts: upcomingContracts });
  } catch (error) {
    console.error('Error fetching upcoming contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 