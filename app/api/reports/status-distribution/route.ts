import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Durum çevirileri için mapping
const statusTranslations: { [key: string]: string } = {
  'DRAFT': 'Taslak',
  'REVIEW': 'İncelemede',
  'APPROVED': 'Onaylandı',
  'SIGNED': 'İmzalandı',
  'ACTIVE': 'Aktif',
  'EXPIRED': 'Süresi Dolmuş',
  'CANCELLED': 'İptal Edildi',
  'TERMINATED': 'Feshedildi'
};

// Her durum için renk paleti
const statusColors: { [key: string]: string } = {
  'DRAFT': '#94A3B8',      // Gri - Taslak
  'REVIEW': '#F59E0B',     // Turuncu - İncelemede
  'APPROVED': '#10B981',   // Yeşil - Onaylandı
  'SIGNED': '#3B82F6',     // Mavi - İmzalandı
  'ACTIVE': '#059669',     // Koyu yeşil - Aktif
  'EXPIRED': '#DC2626',    // Kırmızı - Süresi dolmuş
  'CANCELLED': '#6B7280',  // Koyu gri - İptal edildi
  'TERMINATED': '#7C2D12'  // Kahverengi - Feshedildi
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statusData = await prisma.contract.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Veriyi chart için uygun formata çevir
    const data = statusData.map(item => ({
      status: item.status,
      count: item._count.status,
      name: statusTranslations[item.status] || item.status,
      color: statusColors[item.status] || '#8B5CF6'
    }));

    // Toplam sözleşme sayısını hesapla
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return NextResponse.json({
      data,
      total
    });

  } catch (error) {
    console.error('Status distribution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 