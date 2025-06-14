import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  contractExpiring: z.boolean().optional(),
  contractExpired: z.boolean().optional(),
  contractReminder: z.boolean().optional(),
  approvalNeeded: z.boolean().optional(),
  approvalReceived: z.boolean().optional(),
  versionCreated: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  dashboardNotifications: z.boolean().optional(),
  reminderFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  daysBeforeExpiration: z.number().min(1).max(365).optional(),
});

// GET /api/notifications/settings - Get user notification settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.notificationSettings.findUnique({
      where: {
        userId: session.user.id
      }
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId: session.user.id
        }
      });
    }

    return NextResponse.json(settings);
  } catch (_error) {
    console.error('Error fetching notification settings:');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/notifications/settings - Update notification settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    const settings = await prisma.notificationSettings.upsert({
      where: {
        userId: session.user.id
      },
      create: {
        userId: session.user.id,
        ...validatedData
      },
      update: validatedData
    });

    return NextResponse.json(settings);
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json({ error: _error.errors }, { status: 400 });
    }
    
    console.error('Error updating notification settings:');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 