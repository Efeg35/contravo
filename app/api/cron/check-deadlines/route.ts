import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotificationEmail } from '@/lib/mail';
import { ContractStatus } from '@prisma/client';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Bitiş tarihi yaklaşan sözleşmeleri bul
    const contracts = await prisma.contract.findMany({
      where: {
        endDate: {
          in: [thirtyDaysFromNow, fifteenDaysFromNow, sevenDaysFromNow, oneDayFromNow],
        },
        status: ContractStatus.SIGNED,
      },
      include: {
        createdBy: true,
      },
    });

    // Her sözleşme için bildirim gönder
    for (const contract of contracts) {
      if (!contract.endDate) continue;

      const daysUntilEnd = Math.ceil(
        (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Bildirim mesajını gün sayısına göre özelleştir
      let message = '';
      if (daysUntilEnd === 30) {
        message = `${contract.title} sözleşmenizin bitiş tarihine 30 gün kaldı. Lütfen gerekli işlemleri yapmayı unutmayın.`;
      } else if (daysUntilEnd === 15) {
        message = `${contract.title} sözleşmenizin bitiş tarihine 15 gün kaldı. Lütfen gerekli işlemleri yapmayı unutmayın.`;
      } else if (daysUntilEnd === 7) {
        message = `${contract.title} sözleşmenizin bitiş tarihine 7 gün kaldı. Lütfen gerekli işlemleri yapmayı unutmayın.`;
      } else if (daysUntilEnd === 1) {
        message = `${contract.title} sözleşmenizin bitiş tarihine sadece 1 gün kaldı! Acil olarak gerekli işlemleri yapmanızı rica ederiz.`;
      }

      await sendNotificationEmail({
        to: contract.createdBy.email,
        baslik: 'Sözleşmenizin Bitiş Tarihi Yaklaşıyor!',
        mesaj: message,
        link: `/contracts/${contract.id}`,
        linkText: 'Sözleşmeyi Görüntüle',
      });
    }

    return NextResponse.json({
      success: true,
      message: `${contracts.length} sözleşme için bildirim gönderildi.`,
    });
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Bildirim gönderilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 