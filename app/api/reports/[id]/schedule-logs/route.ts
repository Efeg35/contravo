import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const scheduleId = resolvedParams.id;

    // Schedule'ın varlığını ve kullanıcının erişim hakkını kontrol et
    const schedule = await db.reportSchedule.findFirst({
      where: { 
        savedReportId: scheduleId
      },
      include: {
        savedReport: true
      }
    });

    // Kullanıcının bu report'a erişim hakkı var mı kontrol et  
    if (!schedule || schedule.savedReport.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Schedule bulunamadı veya erişim yetkiniz yok' }, { status: 404 });
    }

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule bulunamadı veya erişim yetkiniz yok' }, { status: 404 });
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