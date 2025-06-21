import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Son 30 günün tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Günlük aktivite verilerini toplamak için Map kullan
    const dailyActivity = new Map<string, {
      contractsCreated: number;
      approvalsCompleted: number;
      signaturesCompleted: number;
    }>();

    // Son 30 günü başlat
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      dailyActivity.set(dateKey, {
        contractsCreated: 0,
        approvalsCompleted: 0,
        signaturesCompleted: 0
      });
    }

    // Sözleşme oluşturma aktivitelerini çek
    const contracts = await db.contract.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true
      }
    });

    // Sözleşme oluşturma aktivitelerini say
    contracts.forEach(contract => {
      const dateKey = contract.createdAt.toISOString().split('T')[0];
      const activity = dailyActivity.get(dateKey);
      if (activity) {
        activity.contractsCreated += 1;
      }
    });

    // Onay aktivitelerini çek
    const approvals = await db.contractApproval.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'APPROVED'
      },
      select: {
        createdAt: true
      }
    });

    // Onay aktivitelerini say
    approvals.forEach(approval => {
      const dateKey = approval.createdAt.toISOString().split('T')[0];
      const activity = dailyActivity.get(dateKey);
      if (activity) {
        activity.approvalsCompleted += 1;
      }
    });

    // İmza aktivitelerini çek
    const signatures = await db.digitalSignature.findMany({
      where: {
        signedAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'SIGNED'
      },
      select: {
        signedAt: true
      }
    });

    // İmza aktivitelerini say
    signatures.forEach(signature => {
      if (signature.signedAt) {
        const dateKey = signature.signedAt.toISOString().split('T')[0];
        const activity = dailyActivity.get(dateKey);
        if (activity) {
          activity.signaturesCompleted += 1;
        }
      }
    });

    // Sonuçları formatla
    const result = Array.from(dailyActivity.entries()).map(([date, activity]) => {
      const dateObj = new Date(date);
      return {
        date,
        displayDate: dateObj.toLocaleDateString('tr-TR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        contractsCreated: activity.contractsCreated,
        approvalsCompleted: activity.approvalsCompleted,
        signaturesCompleted: activity.signaturesCompleted,
        totalActivity: activity.contractsCreated + activity.approvalsCompleted + activity.signaturesCompleted
      };
    });

    // İstatistikler hesapla
    const totalActivity = result.reduce((sum, day) => sum + day.totalActivity, 0);
    const avgDailyActivity = result.length > 0 ? Math.round(totalActivity / result.length) : 0;
    const maxDailyActivity = Math.max(...result.map(day => day.totalActivity));

    return NextResponse.json({
      data: result,
      summary: {
        totalActivity,
        avgDailyActivity,
        maxDailyActivity,
        totalContracts: result.reduce((sum, day) => sum + day.contractsCreated, 0),
        totalApprovals: result.reduce((sum, day) => sum + day.approvalsCompleted, 0),
        totalSignatures: result.reduce((sum, day) => sum + day.signaturesCompleted, 0)
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: 30
      }
    });

  } catch (error) {
    console.error('User activity API hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Kullanıcı aktivite verileri alınamadı',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 