import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Ay isimlerini Türkçe'ye çevirmek için
const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Son 6 ayın tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5); // 6 ay geriye git (current + 5 önceki = 6 toplam)
    startDate.setDate(1); // Ayın ilk günü
    startDate.setHours(0, 0, 0, 0);
    
    // Son güne ayarla
    endDate.setHours(23, 59, 59, 999);

    // Veritabanından veri çek
    const contracts = await prisma.contract.findMany({
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

    // Ay bazında grupla
    const monthlyData: { [key: string]: number } = {};
    
    // Son 6 ayı döngüyle oluştur
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    // Sözleşmeleri aylara göre say
    contracts.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      const monthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    // Chart için uygun formata çevir
    const data = Object.entries(monthlyData).map(([monthKey, count]) => {
      const [year, month] = monthKey.split('-');
      const monthIndex = parseInt(month) - 1;
      const monthName = monthNames[monthIndex];
      
      return {
        month: monthName,
        count,
        fullDate: `${monthName} ${year}`
      };
    });

    return NextResponse.json({
      data
    });

  } catch (error) {
    console.error('Monthly volume API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 