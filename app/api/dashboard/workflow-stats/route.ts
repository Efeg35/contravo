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

    // Get real contract counts from database
    const userId = session.user.id;
    
    // Basic counts
    const totalCount = await prisma.contract.count();
    const inProgressCount = await prisma.contract.count({
      where: { status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] } }
    });
    const assignedToMeCount = await prisma.contract.count({
      where: { createdById: userId }
    });
    const participatingCount = await prisma.contract.count({
      where: { 
        OR: [
          { createdById: userId },
          { updatedById: userId }
        ]
      }
    });
    const completedCount = await prisma.contract.count({
      where: { status: 'COMPLETED' }
    });
    const overdueCount = await prisma.contract.count({
      where: { 
        endDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] }
      }
    });
    const expiringSoonCount = await prisma.contract.count({
      where: { 
        endDate: { 
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] }
      }
    });

    // Specific category counts based on contract types
    const procurementRfpCount = await prisma.contract.count({
      where: { 
        type: { contains: 'RFP' }
      }
    });
    const procurementSpendCount = await prisma.contract.count({
      where: { 
        value: { gt: 1000000 },
        type: { contains: 'Procurement' }
      }
    });
    const generalMndaCount = await prisma.contract.count({
      where: { 
        type: { contains: 'MNDA' }
      }
    });
    const salesHighValueCount = await prisma.contract.count({
      where: { 
        value: { gt: 500000 },
        type: { contains: 'Sales' }
      }
    });
    const financeBusinessCount = await prisma.contract.count({
      where: { 
        type: { contains: 'Finance' }
      }
    });
    const ytdCompletedCount = await prisma.contract.count({
      where: { 
        status: 'COMPLETED',
        createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) }
      }
    });

    const stats = {
      total: totalCount,
      inProgress: inProgressCount,
      assignedToMe: assignedToMeCount,
      participating: participatingCount,
      completed: completedCount,
      overdue: overdueCount,
      expiringSoon: expiringSoonCount,
      procurementRfp: procurementRfpCount,
      procurementSpend: procurementSpendCount,
      generalMnda: generalMndaCount,
      salesHighValue: salesHighValueCount,
      financeBusiness: financeBusinessCount,
      ytdCompleted: ytdCompletedCount
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