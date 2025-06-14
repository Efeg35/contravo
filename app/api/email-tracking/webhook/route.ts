import { NextRequest, NextResponse } from 'next/server';
import { emailTracker } from '../../../../lib/email-tracking';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'generic';
    
    const body = await request.json();
    
    // Verify webhook signature if needed (provider-specific)
    const isValid = await verifyWebhookSignature(request, provider);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Process webhook data
    await emailTracker.handleWebhook(body, provider);

    return NextResponse.json(
      { success: true, message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (_error) {
    console.error('❌ Error processing email webhook:');
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function verifyWebhookSignature(
  request: NextRequest,
  provider: string
): Promise<boolean> {
  try {
    switch (provider.toLowerCase()) {
      case 'sendgrid':
        return await verifySendGridSignature(request);
      case 'mailgun':
        return await verifyMailgunSignature(request);
      case 'ses':
        return await verifySESSignature(request);
      default:
        // For generic webhooks, skip signature verification
        return true;
    }
  } catch (_error) {
    console.error('❌ Error verifying webhook signature:');
    return false;
  }
}

async function verifySendGridSignature(request: NextRequest): Promise<boolean> {
  const signature = (request as any).headers.get('x-twilio-email-event-webhook-signature');
  const timestamp = (request as any).headers.get('x-twilio-email-event-webhook-timestamp');
  
  if (!signature || !timestamp) {
    return false;
  }

  // SendGrid signature verification logic would go here
  // For now, just return true for development
  return true;
}

async function verifyMailgunSignature(request: NextRequest): Promise<boolean> {
  const signature = (request as any).headers.get('x-mailgun-signature');
  const timestamp = (request as any).headers.get('x-mailgun-timestamp');
  
  if (!signature || !timestamp) {
    return false;
  }

  // Mailgun signature verification logic would go here
  return true;
}

async function verifySESSignature(request: NextRequest): Promise<boolean> {
  const messageType = (request as any).headers.get('x-amz-sns-message-type');
  
  if (!messageType) {
    return false;
  }

  // AWS SES/SNS signature verification logic would go here
  return true;
} 