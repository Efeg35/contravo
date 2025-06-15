import { NextRequest, NextResponse } from 'next/server';
import { notificationQueue, sendEmail, sendBatchEmails, sendSMS, createNotification } from '../../../../lib/notification-queue';
import { sendTemplatedSMS } from '../../../../lib/sms-service';

// GET - Queue statistics
export async function GET() {
  try {
    const stats = await notificationQueue.getQueueStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch {
    console.error('❌ Error getting queue stats:');
    
    return NextResponse.json(
      { error: 'Failed to get queue statistics' },
      { status: 500 }
    );
  }
}

// POST - Add job to queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let jobId: string;

    switch (type) {
      case 'email':
        jobId = await sendEmail(data);
        break;
      
      case 'batch_email':
        jobId = await sendBatchEmails(data);
        break;
      
      case 'sms':
        jobId = await sendSMS(data);
        break;
        
      case 'templated_sms':
        const result = await sendTemplatedSMS(
          data.templateType,
          data.phone,
          data.variables,
          {
            userId: data.userId,
            contractId: data.contractId,
            metadata: data.metadata
          }
        );
        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });
      
      case 'notification':
        jobId = await createNotification(data);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown job type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job added to queue successfully'
    });

  } catch {
    console.error('❌ Error adding job to queue:');
    
    return NextResponse.json(
      { error: 'Failed to add job to queue' },
      { status: 500 }
    );
  }
} 