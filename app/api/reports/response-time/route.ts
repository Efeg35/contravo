import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Bu ay ve geçen ayın tarih aralıklarını hesapla
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // İmzalanmış/tamamlanmış sözleşmeleri çek (son 90 gün)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const completedContracts = await db.contract.findMany({
      where: {
        status: 'SIGNED',
        updatedAt: {
          gte: threeMonthsAgo
        }
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Yanıt sürelerini hesapla (gün cinsinden)
    const responseTimes: number[] = [];
    const thisMonthTimes: number[] = [];
    const lastMonthTimes: number[] = [];

    const distribution = {
      fast: 0,    // 0-7 gün
      medium: 0,  // 8-30 gün  
      slow: 0     // 31+ gün
    };

    completedContracts.forEach(contract => {
      const startDate = new Date(contract.createdAt);
      const endDate = new Date(contract.updatedAt);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      responseTimes.push(diffDays);

      // Süre dağılımını kategorize et
      if (diffDays <= 7) {
        distribution.fast += 1;
      } else if (diffDays <= 30) {
        distribution.medium += 1;
      } else {
        distribution.slow += 1;
      }

      // Aylık karşılaştırma için kategorize et
      const completionDate = new Date(contract.updatedAt);
      if (completionDate >= thisMonthStart) {
        thisMonthTimes.push(diffDays);
      } else if (completionDate >= lastMonthStart && completionDate <= lastMonthEnd) {
        lastMonthTimes.push(diffDays);
      }
    });

    // İstatistikleri hesapla
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const medianResponseTime = sortedTimes.length > 0
      ? sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
        : sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0;

    const fastestCompletion = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const slowestCompletion = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    // Geçen ayla karşılaştırma
    const thisMonthAvg = thisMonthTimes.length > 0 
      ? thisMonthTimes.reduce((sum, time) => sum + time, 0) / thisMonthTimes.length 
      : 0;
    const lastMonthAvg = lastMonthTimes.length > 0 
      ? lastMonthTimes.reduce((sum, time) => sum + time, 0) / lastMonthTimes.length 
      : 0;

    const improvementFromLastMonth = lastMonthAvg > 0 
      ? ((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100
      : 0;

    const result = {
      averageResponseTime: Number(averageResponseTime.toFixed(1)),
      medianResponseTime: Number(medianResponseTime.toFixed(1)),
      fastestCompletion: Number(fastestCompletion.toFixed(1)),
      slowestCompletion: Number(slowestCompletion.toFixed(1)),
      totalCompletedContracts: completedContracts.length,
      improvementFromLastMonth: Number(improvementFromLastMonth.toFixed(1)),
      responseTimeDistribution: distribution
    };

    return NextResponse.json({
      data: result,
      period: {
        start: threeMonthsAgo.toISOString(),
        end: now.toISOString(),
        thisMonthContracts: thisMonthTimes.length,
        lastMonthContracts: lastMonthTimes.length
      },
      rawData: {
        responseTimes: responseTimes.slice(0, 10), // İlk 10 örnek
        thisMonthAvg: Number(thisMonthAvg.toFixed(1)),
        lastMonthAvg: Number(lastMonthAvg.toFixed(1))
      }
    });

  } catch (error) {
    console.error('Response time API hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Yanıt süresi verileri alınamadı',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 