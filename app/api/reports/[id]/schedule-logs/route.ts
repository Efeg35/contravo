import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const scheduleId = resolvedParams.id;

    // Schedule'ın varlığını kontrol et
    const schedule = await db.reportSchedule.findUnique({
      where: { savedReportId: scheduleId }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule bulunamadı' }, { status: 404 });
    }

    // Son 10 log kaydını çek
    const logs = await db.scheduleLog.findMany({
      where: {
        scheduleId: schedule.id
      },
      orderBy: {
        executedAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      logs: logs,
      total: logs.length
    });

  } catch (error) {
    console.error('Schedule logs fetch hatası:', error);
    return NextResponse.json(
      { error: 'Loglar çekilirken hata oluştu' },
      { status: 500 }
    );
  }
} 