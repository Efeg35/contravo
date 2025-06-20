'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function saveReport(name: string, description: string | null, configuration: any) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const savedReport = await prisma.savedReport.create({
      data: {
        name,
        description,
        configuration,
        authorId: session.user.id,
      },
    });

    revalidatePath('/dashboard/reports');
    return { success: true, id: savedReport.id };
  } catch (error) {
    console.error('Error saving report:', error);
    throw new Error('Failed to save report');
  }
}

export async function getSavedReports() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return [];
  }

  try {
    const savedReports = await prisma.savedReport.findMany({
      where: {
        authorId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        configuration: true,
        createdAt: true,
        updatedAt: true,
        schedule: {
          select: {
            id: true,
            cron: true,
            recipients: true,
            status: true,
          },
        },
      },
    });

    return savedReports;
  } catch (error) {
    console.error('Error fetching saved reports:', error);
    return [];
  }
}

export async function deleteSavedReport(reportId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    await prisma.savedReport.delete({
      where: {
        id: reportId,
        authorId: session.user.id, // Sadece kendi raporlarını silebilir
      },
    });

    revalidatePath('/dashboard/reports');
    return { success: true };
  } catch (error) {
    console.error('Error deleting saved report:', error);
    throw new Error('Failed to delete report');
  }
}

export async function saveReportSchedule({
  savedReportId,
  cron,
  recipients,
  status,
}: {
  savedReportId: string;
  cron: string;
  recipients: string[];
  status: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    // Önce raporun kullanıcıya ait olduğunu doğrula
    const savedReport = await prisma.savedReport.findFirst({
      where: {
        id: savedReportId,
        authorId: session.user.id,
      },
    });

    if (!savedReport) {
      throw new Error('Report not found or access denied');
    }

    // Zamanlama kaydı oluştur veya güncelle (upsert)
    const schedule = await prisma.reportSchedule.upsert({
      where: {
        savedReportId: savedReportId,
      },
      create: {
        savedReportId: savedReportId,
        cron,
        recipients,
        status,
      },
      update: {
        cron,
        recipients,
        status,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/reports');
    return { success: true, schedule };
  } catch (error) {
    console.error('Error saving report schedule:', error);
    throw new Error('Failed to save report schedule');
  }
} 