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