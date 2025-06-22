import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendReportEmail } from '@/lib/mail';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportTemplate } from '@/components/pdf/ReportTemplate';
import { createElement } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cronParser = require('cron-parser');

export async function GET(request: NextRequest) {
  try {
    // Check if request has proper authorization header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Zamanlanmış raporlar kontrolü başlatıldı:', new Date().toISOString());

    // 1. Aktif zamanlamaları çek
    const activeSchedules = await db.reportSchedule.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        savedReport: true
      }
    });

    console.log(`[CRON] ${activeSchedules.length} aktif zamanlama bulundu`);

    if (activeSchedules.length === 0) {
      return NextResponse.json({ 
        message: 'Aktif zamanlama bulunamadı',
        processedCount: 0 
      });
    }

    const processedReports = [];
    const currentTime = new Date();

    // 2. Her zamanlama için kontrol et
    for (const schedule of activeSchedules) {
      // Cron ifadesini parse et
      const cronExpression = cronParser.parseExpression(schedule.cron);
      
      // Son çalışma zamanından şimdi arasında bu cron'un tetiklenmesi gerekip gerekmediğini kontrol et
      // Basit kontrol: son 15 dakika içinde bu zamanın gelmesi gerekiyorsa çalıştır
      const last15Minutes = new Date(currentTime.getTime() - 15 * 60 * 1000);
      const nextRun = cronExpression.prev().toDate();
      
      console.log(`[CRON] Schedule ${schedule.id}: Son çalışma ${nextRun}, Kontrol aralığı: ${last15Minutes}`);

      // Eğer son 15 dakika içinde bu cron zamanı geldiyse
      if (nextRun >= last15Minutes && nextRun <= currentTime) {
        console.log(`[CRON] Rapor çalıştırılacak: ${schedule.savedReport.name}`);

        try {
          // 3. Rapor verisini çek
          const reportData = await generateReportData(schedule.savedReport.configuration);
          
          // 4. PDF oluştur - createElement ile proper React element
          const reportElement = createElement(ReportTemplate, {
            title: schedule.savedReport.name,
            data: reportData.data,
            selectedFields: reportData.fields || [],
            filters: reportData.filters,
            generatedAt: new Date().toISOString(),
            userInfo: {
              name: 'Sistem',
              email: 'sistem@contravo.com',
              company: 'Contravo'
            }
          });

          const pdfBuffer = await renderToBuffer(reportElement);

          // 5. E-posta gönder
          const recipients = Array.isArray(schedule.recipients) 
            ? schedule.recipients as string[]
            : [schedule.recipients as string];

          const emailResult = await sendReportEmail({
            to: recipients,
            reportName: schedule.savedReport.name,
            attachments: [{
              filename: `${schedule.savedReport.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
              content: pdfBuffer
            }]
          });

          // 6. SUCCESS LOG KAYDI - Başarılı işlem kaydı
          await db.scheduleLog.create({
            data: {
              scheduleId: schedule.id,
              status: 'SUCCESS',
              details: `Rapor başarıyla oluşturulup ${recipients.length} alıcıya gönderildi. Alıcılar: ${recipients.join(', ')}. Veri kaynağı: ${reportData.dataSource}, ${reportData.totalCount} kayıt işlendi.`,
              executedAt: new Date()
            }
          });

          processedReports.push({
            scheduleId: schedule.id,
            reportName: schedule.savedReport.name,
            recipients: recipients,
            emailResult: emailResult,
            processedAt: currentTime.toISOString(),
            status: 'SUCCESS'
          });

          console.log(`[CRON] Rapor başarıyla gönderildi ve loglandı: ${schedule.savedReport.name}`);

        } catch (scheduleError) {
          // 7. FAILURE LOG KAYDI - Hata durumu kaydı
          const errorMessage = scheduleError instanceof Error ? scheduleError.message : 'Bilinmeyen hata';
          
          try {
            await db.scheduleLog.create({
              data: {
                scheduleId: schedule.id,
                status: 'FAILURE',
                details: `Rapor çalıştırma hatası: ${errorMessage}. Rapor: ${schedule.savedReport.name}. Hata detayı: ${scheduleError instanceof Error ? scheduleError.stack : 'Stack trace bulunamadı'}`,
                executedAt: new Date()
              }
            });
          } catch (logError) {
            console.error(`[CRON] Log kaydı yazılırken hata oluştu:`, logError);
          }

          console.error(`[CRON] Schedule ${schedule.id} işlenirken hata:`, scheduleError);
          processedReports.push({
            scheduleId: schedule.id,
            reportName: schedule.savedReport.name,
            error: errorMessage,
            processedAt: currentTime.toISOString(),
            status: 'FAILURE'
          });
        }
      } else {
        console.log(`[CRON] Rapor zamanı henüz gelmedi: ${schedule.savedReport.name}`);
      }
    }

    console.log(`[CRON] İşlem tamamlandı. ${processedReports.length} rapor işlendi`);

    return NextResponse.json({
      message: 'Zamanlanmış raporlar işlendi',
      processedCount: processedReports.length,
      totalSchedules: activeSchedules.length,
      processedReports: processedReports,
      timestamp: currentTime.toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('[CRON] Zamanlanmış rapor çalıştırma hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Zamanlanmış rapor çalıştırma hatası',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Rapor verisini oluşturma fonksiyonu - basitleştirilmiş
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateReportData(configuration: any) {
  try {
    const config = typeof configuration === 'string' 
      ? JSON.parse(configuration) 
      : configuration;

    // Varsayılan değerler
    const dataSource = config.dataSource || 'contracts';
    const fields = config.fields || ['title', 'status'];
    const filters = config.filters || [];

    console.log(`[CRON] Rapor verisi oluşturuluyor - Kaynak: ${dataSource}`);

    // Veri çekme işlemi - sadece basit alanlar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = [];
    
    if (dataSource === 'contracts') {
      // Sözleşme verisi çek - SYSTEM ACCESS (All departments)
      // Note: Cron jobs run with system privileges, showing aggregated data across all departments
      const contracts = await db.contract.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 100 // Limit ekleyelim
      });

      data = contracts.map(contract => ({
        id: contract.id,
        title: contract.title || 'Başlıksız',
        status: contract.status || 'DRAFT',
        createdAt: contract.createdAt?.toISOString() || '',
        value: contract.value || 0
      }));

    } else if (dataSource === 'companies') {
      // Şirket verisi çek - SYSTEM ACCESS (All companies)
      // Note: System-level report, showing all companies
      const companies = await db.company.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      data = companies.map(company => ({
        id: company.id,
        title: company.name || 'İsimsiz Şirket',
        status: 'ACTIVE',
        createdAt: company.createdAt?.toISOString() || ''
      }));

    } else if (dataSource === 'users') {
      // Kullanıcı verisi çek - SYSTEM ACCESS (All users)
      // Note: System-level report, showing all users (admin reports only)
      const users = await db.user.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      data = users.map(user => ({
        id: user.id,
        title: user.name || 'İsimsiz Kullanıcı',
        status: user.role || 'USER',
        createdAt: user.createdAt?.toISOString() || ''
      }));
    }

    console.log(`[CRON] ${data.length} kayıt bulundu`);

    return {
      data: data,
      filters: filters,
      fields: fields,
      totalCount: data.length,
      dataSource: dataSource
    };

  } catch (error) {
    console.error('[CRON] Rapor verisi oluşturma hatası:', error);
    throw error;
  }
} 