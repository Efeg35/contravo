import { NextRequest, NextResponse } from 'next/server';
import { emailTracker } from '../../../../../lib/email-tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  try {
    const { deliveryId } = await params;
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get('url');

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 }
      );
    }

    const userAgent = (request as any).headers.get('user-agent') || undefined;
    const forwarded = (request as any).headers.get('x-forwarded-for');
    const realIp = (request as any).headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || undefined;

    // Process click tracking
    const redirectUrl = await emailTracker.processClickTracking(
      deliveryId,
      originalUrl,
      userAgent,
      ipAddress
    );

    // Redirect to original URL
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (_error) {
    console.error('❌ Error in click tracking:');
    
    // Try to redirect to the original URL even if tracking fails
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get('url');
    
    if (originalUrl) {
      return NextResponse.redirect(originalUrl, { status: 302 });
    }
    
    return NextResponse.json(
      { error: 'Invalid tracking request' },
      { status: 400 }
    );
  }
} 