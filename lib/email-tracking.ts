// import prisma from './prisma'; // Will be used in real implementation
// import { EmailTemplateData } from './email-templates'; // Will be used for template data typing

export interface EmailDeliveryData {
  messageId: string;
  recipient: string;
  templateType: string;
  userId?: string;
  contractId?: string;
  sentAt: Date;
  metadata?: Record<string, unknown>;
}

export interface EmailTrackingEvent {
  id: string;
  deliveryId: string;
  eventType: EmailEventType;
  timestamp: Date;
  data?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
}

export enum EmailEventType {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  FAILED = 'FAILED'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED'
}

export interface EmailDeliveryRecord {
  id: string;
  messageId: string;
  recipient: string;
  templateType: string;
  userId?: string;
  contractId?: string;
  status: DeliveryStatus;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  firstClickedAt?: Date;
  bounceReason?: string;
  complaintReason?: string;
  openCount: number;
  clickCount: number;
  events: EmailTrackingEvent[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

class EmailTracker {
  private static instance: EmailTracker;
  
  private constructor() {}

  static getInstance(): EmailTracker {
    if (!EmailTracker.instance) {
      EmailTracker.instance = new EmailTracker();
    }
    return EmailTracker.instance;
  }

  // Create email delivery record
  async createDeliveryRecord(data: EmailDeliveryData): Promise<string> {
    try {
      // In a real implementation, this would save to database
      const deliveryRecord = {
        id: this.generateTrackingId(),
        messageId: data.messageId,
        recipient: data.recipient,
        templateType: data.templateType,
        userId: data.userId,
        contractId: data.contractId,
        status: DeliveryStatus.SENT,
        sentAt: data.sentAt,
        openCount: 0,
        clickCount: 0,
        events: [{
          id: this.generateEventId(),
          deliveryId: this.generateTrackingId(),
          eventType: EmailEventType.SENT,
          timestamp: data.sentAt,
          data: data.metadata
        } as EmailTrackingEvent],
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      } as EmailDeliveryRecord;

      // Save to database (mock implementation)
      await this.saveDeliveryRecord(deliveryRecord);
      
      console.log(`📧 Email delivery record created: ${deliveryRecord.id}`);
      
      return deliveryRecord.id;
    } catch (_error) {
      console.error('❌ Error creating delivery record:');
      throw _error;
    }
  }

  // Track email events
  async trackEvent(
    deliveryId: string, 
    eventType: EmailEventType, 
    data?: Record<string, unknown>,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const event: EmailTrackingEvent = {
        id: this.generateEventId(),
        deliveryId,
        eventType,
        timestamp: new Date(),
        data,
        userAgent,
        ipAddress
      };

      await this.saveTrackingEvent(event);
      await this.updateDeliveryStatus(deliveryId, eventType, event.timestamp);
      
      console.log(`📊 Email event tracked: ${eventType} for delivery ${deliveryId}`);
      
    } catch (_error) {
      console.error('❌ Error tracking email:', _error);
      throw _error;
    }
  }

  // Generate tracking pixel for email opens
  generateTrackingPixel(deliveryId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/email-tracking/pixel/${deliveryId}`;
  }

  // Generate tracked link for clicks
  generateTrackedLink(deliveryId: string, originalUrl: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/email-tracking/click/${deliveryId}?url=${encodedUrl}`;
  }

  // Process tracking pixel request
  async processPixelTracking(
    deliveryId: string, 
    userAgent?: string, 
    ipAddress?: string
  ): Promise<Buffer> {
    try {
      await this.trackEvent(
        deliveryId, 
        EmailEventType.OPENED, 
        { source: 'pixel' },
        userAgent,
        ipAddress
      );

      // Return 1x1 transparent pixel
      return this.getTrackingPixelImage();
    } catch (_error) {
      console.error('❌ Error processing pixel tracking:');
      return this.getTrackingPixelImage(); // Still return pixel even on error
    }
  }

  // Process click tracking
  async processClickTracking(
    deliveryId: string,
    originalUrl: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string> {
    try {
      await this.trackEvent(
        deliveryId,
        EmailEventType.CLICKED,
        { url: originalUrl },
        userAgent,
        ipAddress
      );

      return originalUrl;
    } catch (_error) {
      console.error('❌ Error processing click tracking:');
      return originalUrl; // Still redirect even on error
    }
  }

  // Get delivery statistics
  async getDeliveryStats(deliveryId: string): Promise<EmailDeliveryRecord | null> {
    try {
      return await this.getDeliveryRecord(deliveryId);
    } catch (_error) {
      console.error('❌ Error getting delivery stats:');
      return null;
    }
  }

  // Get user email statistics
  async getUserEmailStats(userId: string, days: number = 30): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplained: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
    recentDeliveries: EmailDeliveryRecord[];
  }> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Mock implementation - in reality, query database
      const stats = {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalComplained: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        complaintRate: 0,
        recentDeliveries: [] as EmailDeliveryRecord[]
      };

      console.log(`📊 Email stats for user ${userId}:`, stats);
      
      return stats;
    } catch (_error) {
      console.error('❌ Error getting user email stats:');
      throw _error;
    }
  }

  // Get template performance
  async getTemplateStats(templateType: string, days: number = 30): Promise<{
    templateType: string;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    avgOpenTime: number;
    avgClickTime: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    performance: 'good' | 'average' | 'poor';
  }> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Mock implementation
      const stats = {
        templateType,
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        avgOpenTime: 0,
        avgClickTime: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        performance: 'good' as 'good' | 'average' | 'poor'
      };

      console.log(`📊 Template stats for ${templateType}:`, stats);
      
      return stats;
    } catch (_error) {
      console.error('❌ Error getting template stats:');
      throw _error;
    }
  }

  // Webhook handler for email service provider (like SendGrid, Mailgun)
  async handleWebhook(webhookData: Record<string, unknown>, provider: string = 'generic'): Promise<void> {
    try {
      console.log(`📨 Processing webhook from ${provider}:`, webhookData);
      
      switch (provider.toLowerCase()) {
        case 'sendgrid':
          await this.processSendGridWebhook(webhookData);
          break;
        case 'mailgun':
          await this.processMailgunWebhook(webhookData);
          break;
        case 'ses':
          await this.processSESWebhook(webhookData);
          break;
        default:
          await this.processGenericWebhook(webhookData);
      }
    } catch (_error) {
      console.error('❌ Error processing webhook:');
      throw _error;
    }
  }

  // Analytics and reporting
  async generateEmailReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string;
      templateType?: string;
      contractId?: string;
    }
  ): Promise<{
    period: {
      startDate: Date;
      endDate: Date;
      days: number;
    };
    filters?: {
      userId?: string;
      templateType?: string;
      contractId?: string;
    };
    summary: {
      totalEmails: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      complained: number;
      unsubscribed: number;
    };
    rates: {
      deliveryRate: number;
      openRate: number;
      clickRate: number;
      bounceRate: number;
      complaintRate: number;
      unsubscribeRate: number;
    };
    trends: {
      daily: Array<Record<string, unknown>>;
      weekly: Array<Record<string, unknown>>;
    };
    topTemplates: Array<Record<string, unknown>>;
    devices: {
      desktop: number;
      mobile: number;
      tablet: number;
      unknown: number;
    };
    locations: Array<Record<string, unknown>>;
  }> {
    try {
      const report = {
        period: {
          startDate,
          endDate,
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        filters,
        summary: {
          totalEmails: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          unsubscribed: 0
        },
        rates: {
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
          complaintRate: 0,
          unsubscribeRate: 0
        },
        trends: {
          daily: [] as Array<Record<string, unknown>>,
          weekly: [] as Array<Record<string, unknown>>
        },
        topTemplates: [] as Array<Record<string, unknown>>,
        devices: {
          desktop: 0,
          mobile: 0,
          tablet: 0,
          unknown: 0
        },
        locations: [] as Array<Record<string, unknown>>
      };

      console.log('📊 Generated email report:', report);
      
      return report;
    } catch (_error) {
      console.error('❌ Error generating email report:');
      throw _error;
    }
  }

  // Private methods
  private async updateDeliveryStatus(
    deliveryId: string, 
    eventType: EmailEventType, 
    timestamp: Date
  ): Promise<void> {
    // Mock implementation - update delivery record based on event
    console.log(`📝 Updating delivery ${deliveryId} with event ${eventType} at ${timestamp}`);
  }

  private async saveDeliveryRecord(record: EmailDeliveryRecord): Promise<void> {
    // Mock implementation - save to database
    console.log('💾 Saving delivery record:', record.id);
  }

  private async saveTrackingEvent(event: EmailTrackingEvent): Promise<void> {
    // Mock implementation - save to database
    console.log('💾 Saving tracking event:', event.id);
  }

  private async getDeliveryRecord(deliveryId: string): Promise<EmailDeliveryRecord | null> {
    // Mock implementation - get from database
    console.log('📂 Getting delivery record:', deliveryId);
    return null;
  }

  private async processSendGridWebhook(data: Record<string, unknown>): Promise<void> {
    // Process SendGrid-specific webhook format
    if (Array.isArray(data)) {
      for (const event of data) {
        const eventType = this.mapSendGridEvent(event.event);
        if (eventType && event.sg_message_id) {
          await this.trackEvent(
            event.sg_message_id,
            eventType,
            event,
            event.useragent,
            event.ip
          );
        }
      }
    }
  }

  private async processMailgunWebhook(data: Record<string, unknown>): Promise<void> {
    // Process Mailgun-specific webhook format
    const eventType = this.mapMailgunEvent(data.event as string);
    if (eventType && data['message-id']) {
      await this.trackEvent(
        data['message-id'] as string,
        eventType,
        data,
        data['user-agent'] as string,
        data['client-ip'] as string
      );
    }
  }

  private async processSESWebhook(data: Record<string, unknown>): Promise<void> {
    // Process AWS SES-specific webhook format
    const mail = data.mail as Record<string, unknown>;
    if (data.eventType && mail && mail.messageId) {
      const eventType = this.mapSESEvent(data.eventType as string);
      if (eventType) {
        await this.trackEvent(
          mail.messageId as string,
          eventType,
          data,
          data.userAgent as string,
          data.ipAddress as string
        );
      }
    }
  }

  private async processGenericWebhook(data: Record<string, unknown>): Promise<void> {
    // Process generic webhook format
    console.log('📨 Processing generic webhook:', data);
  }

  private mapSendGridEvent(event: string): EmailEventType | null {
    const mapping: { [key: string]: EmailEventType } = {
      'delivered': EmailEventType.DELIVERED,
      'open': EmailEventType.OPENED,
      'click': EmailEventType.CLICKED,
      'bounce': EmailEventType.BOUNCED,
      'spamreport': EmailEventType.COMPLAINED,
      'unsubscribe': EmailEventType.UNSUBSCRIBED,
      'dropped': EmailEventType.FAILED
    };
    return mapping[event] || null;
  }

  private mapMailgunEvent(event: string): EmailEventType | null {
    const mapping: { [key: string]: EmailEventType } = {
      'delivered': EmailEventType.DELIVERED,
      'opened': EmailEventType.OPENED,
      'clicked': EmailEventType.CLICKED,
      'bounced': EmailEventType.BOUNCED,
      'complained': EmailEventType.COMPLAINED,
      'unsubscribed': EmailEventType.UNSUBSCRIBED,
      'failed': EmailEventType.FAILED
    };
    return mapping[event] || null;
  }

  private mapSESEvent(event: string): EmailEventType | null {
    const mapping: { [key: string]: EmailEventType } = {
      'delivery': EmailEventType.DELIVERED,
      'open': EmailEventType.OPENED,
      'click': EmailEventType.CLICKED,
      'bounce': EmailEventType.BOUNCED,
      'complaint': EmailEventType.COMPLAINED,
      'reject': EmailEventType.FAILED
    };
    return mapping[event] || null;
  }

  private getTrackingPixelImage(): Buffer {
    // 1x1 transparent PNG pixel
    const pixel = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    return pixel;
  }

  private generateTrackingId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const emailTracker = EmailTracker.getInstance();

// Helper functions
export async function trackEmailDelivery(data: EmailDeliveryData): Promise<string> {
  return emailTracker.createDeliveryRecord(data);
}

export async function trackEmailEvent(
  deliveryId: string,
  eventType: EmailEventType,
  data?: Record<string, unknown>,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  return emailTracker.trackEvent(deliveryId, eventType, data, userAgent, ipAddress);
}

export function generateTrackingPixel(deliveryId: string): string {
  return emailTracker.generateTrackingPixel(deliveryId);
}

export function generateTrackedLink(deliveryId: string, originalUrl: string): string {
  return emailTracker.generateTrackedLink(deliveryId, originalUrl);
} 