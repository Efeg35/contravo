import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Son 6 ayın tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    // Veritabanından sözleşme verilerini çek
    const contracts = await db.contract.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // Sadece değeri olan sözleşmeleri al
        value: {
          not: null,
          gt: 0
        }
      },
      select: {
        value: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Ayları grupla ve topla
    const monthlyData = new Map<string, { revenue: number; contracts: number }>();
    
    // Son 6 ayı başlat
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthKey = date.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      monthlyData.set(monthKey, { revenue: 0, contracts: 0 });
    }

    // Sözleşmeleri aylara göre grupla
    contracts.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      const monthKey = contractDate.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (monthlyData.has(monthKey)) {
        const existing = monthlyData.get(monthKey)!;
        existing.revenue += contract.value || 0;
        existing.contracts += 1;
      }
    });

    // Sonuçları düzenle
    const result = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      contracts: data.contracts
    }));

    return NextResponse.json({
      data: result,
      totalRevenue: result.reduce((sum, item) => sum + item.revenue, 0),
      totalContracts: result.reduce((sum, item) => sum + item.contracts, 0),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Revenue trend API hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Gelir trend verileri alınamadı',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 