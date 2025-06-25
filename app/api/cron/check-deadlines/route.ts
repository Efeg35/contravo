import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ContractStatusEnum } from '@/app/types';

export async function GET(request: NextRequest) {
  try {
    // Check if request has proper authorization header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check for contracts expiring within a week
    const expiringContracts = await db.contract.findMany({
      where: {
        status: ContractStatusEnum.SIGNING,
        expirationDate: {
          gte: now,
          lte: oneWeekFromNow,
        },
      },
      include: {
        createdBy: {
          select: { email: true, name: true }
        },
        company: {
          select: { name: true }
        }
      }
    });

    // Check for contracts that need renewal
    const renewalContracts = await db.contract.findMany({
      where: {
        status: ContractStatusEnum.SIGNING,
        autoRenewal: true,
        renewalDate: {
          gte: now,
          lte: oneMonthFromNow,
        },
      },
      include: {
        createdBy: {
          select: { email: true, name: true }
        },
        company: {
          select: { name: true }
        }
      }
    });

    // Log notifications instead of sending emails for now
    for (const contract of expiringContracts) {
      console.log(`Contract expiring notification: ${contract.title} for ${contract.createdBy.email}`);
    }

    for (const contract of renewalContracts) {
      console.log(`Contract renewal notification: ${contract.title} for ${contract.createdBy.email}`);
    }

    return NextResponse.json({
      message: 'Deadline check completed',
      expiringContracts: expiringContracts.length,
      renewalContracts: renewalContracts.length,
    });

  } catch (error) {
    console.error('Error checking deadlines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 