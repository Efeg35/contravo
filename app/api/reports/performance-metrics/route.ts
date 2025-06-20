import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // İmzalanmış sözleşmeleri al (SIGNED status)
    const signedContracts = await prisma.contract.findMany({
      where: {
        status: 'SIGNED'
      },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true
      }
    });

    // Toplam sözleşme sayıları
    const totalContracts = await prisma.contract.count();
    const activeContracts = await prisma.contract.count({
      where: { status: 'ACTIVE' }
    });
    const pendingContracts = await prisma.contract.count({
      where: { status: { in: ['DRAFT', 'REVIEW'] } }
    });

    // Ortalama tamamlanma süresini hesapla
    let averageCompletionDays = 0;
    if (signedContracts.length > 0) {
      const totalDays = signedContracts.reduce((sum, contract) => {
        const start = new Date(contract.createdAt);
        const end = new Date(contract.updatedAt);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      averageCompletionDays = Math.round((totalDays / signedContracts.length) * 10) / 10;
    }

    const data = {
      averageCompletionDays,
      totalContracts,
      activeContracts,
      pendingContracts,
      signedContracts: signedContracts.length
    };

    return NextResponse.json({
      data
    });

  } catch (error) {
    console.error('Performance metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 