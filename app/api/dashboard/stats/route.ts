import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total contracts for the user
    const totalContracts = await prisma.contract.count({
      where: {
        createdById: session.user.id
      }
    });

    // Get contracts by status
    const contractsByStatus = await prisma.contract.groupBy({
      by: ['status'],
      where: {
        createdById: session.user.id
      },
      _count: {
        id: true
      }
    });

    // Convert to the expected format
    const statusCounts = contractsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get this month's contracts
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyContracts = await prisma.contract.count({
      where: {
        createdById: session.user.id,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Get recent contracts
    const recentContracts = await prisma.contract.findMany({
      where: {
        createdById: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        otherPartyName: true
      }
    });

    const stats = {
      totalContracts,
      draftContracts: statusCounts['DRAFT'] || 0,
      reviewContracts: statusCounts['IN_REVIEW'] || 0,
      signedContracts: statusCounts['SIGNED'] || 0,
      monthlyContracts,
      recentContracts: recentContracts.map(contract => ({
        ...contract,
        createdAt: contract.createdAt.toISOString()
      }))
    };

    return NextResponse.json(stats);
  } catch {
    console.error('Dashboard stats error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 