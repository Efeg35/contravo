// import prisma from './prisma'; // Will be used in real implementation

export interface SMSMessage {
  id: string;
  phone: string;
  message: string;
  status: SMSStatus;
  providerId?: string;
  provider: SMSProvider;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  cost?: number;
  userId?: string;
  contractId?: string;
  templateType?: string;
   
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum SMSStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED'
}

export enum SMSProvider {
  TWILIO = 'TWILIO',
  VONAGE = 'VONAGE',
  AWS_SNS = 'AWS_SNS',
  FIREBASE = 'FIREBASE',
  MOCK = 'MOCK'
}

export interface SMSTemplate {
  type: string;
  message: string;
  variables: string[];
}

export interface SMSJobData {
  phone: string;
  message: string;
  userId?: string;
  contractId?: string;
  templateType?: string;
   
  metadata?: any;
  priority?: number;
  scheduledFor?: Date;
}

export interface SMSStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  totalCost: number;
  recentMessages: SMSMessage[];
}

class SMSService {
  private static instance: SMSService;
  private provider: SMSProvider;
   
  private config: any = {};

  private constructor() {
    // Determine SMS provider from environment
    this.provider = this.getProviderFromConfig();
    this.loadProviderConfig();
  }

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  // Send SMS message
  async sendSMS(data: SMSJobData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📱 Sending SMS to ${data.phone}: ${data.message.substring(0, 50)}...`);

      // Validate phone number
      if (!this.validatePhoneNumber(data.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Create SMS record
      const smsMessage: SMSMessage = {
        id: this.generateMessageId(),
        phone: data.phone,
        message: data.message,
        status: SMSStatus.PENDING,
        provider: this.provider,
        userId: data.userId,
        contractId: data.contractId,
        templateType: data.templateType,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      await this.saveSMSRecord(smsMessage);

      // Send via provider
      let result;
      switch (this.provider) {
        case SMSProvider.TWILIO:
          result = await this.sendViaTwilio(smsMessage);
          break;
        case SMSProvider.VONAGE:
          result = await this.sendViaVonage(smsMessage);
          break;
        case SMSProvider.AWS_SNS:
          result = await this.sendViaAWSSNS(smsMessage);
          break;
        case SMSProvider.MOCK:
          result = await this.sendViaMock(smsMessage);
          break;
        default:
          throw new Error(`Unsupported SMS provider: ${this.provider}`);
      }

      // Update SMS record with result
      smsMessage.status = result.success ? SMSStatus.SENT : SMSStatus.FAILED;
      smsMessage.providerId = result.providerId;
      smsMessage.sentAt = result.success ? new Date() : undefined;
      smsMessage.error = result.error;
      smsMessage.cost = result.cost;
      smsMessage.updatedAt = new Date();

      await this.updateSMSRecord(smsMessage);

      console.log(`${result.success ? '✅' : '❌'} SMS ${result.success ? 'sent' : 'failed'}: ${smsMessage.id}`);

      return {
        success: result.success,
        messageId: smsMessage.id,
        error: result.error
      };

    } catch {
      console.error('❌ Error sending SMS:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Send SMS using template
  async sendTemplatedSMS(
    templateType: string,
    phone: string,
    variables: { [key: string]: string },
    options?: {
      userId?: string;
      contractId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.getSMSTemplate(templateType);
      if (!template) {
        throw new Error(`SMS template not found: ${templateType}`);
      }

      const message = this.processTemplate(template.message, variables);

      return this.sendSMS({
        phone,
        message,
        userId: options?.userId,
        contractId: options?.contractId,
        templateType,
        metadata: { ...options?.metadata, variables }
      });

    } catch {
      console.error('❌ Error sending templated SMS:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Send batch SMS
  async sendBatchSMS(
    messages: Array<{
      phone: string;
      message: string;
      userId?: string;
      contractId?: string;
      metadata?: Record<string, unknown>;
    }>,
    options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
    }
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ success: boolean; messageId?: string; error?: string; phone: string }>;
  }> {
    const batchSize = options?.batchSize || 10;
    const delay = options?.delayBetweenBatches || 1000;
    const results = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (msg) => {
        const result = await this.sendSMS({
          phone: msg.phone,
          message: msg.message,
          userId: msg.userId,
          contractId: msg.contractId,
          metadata: msg.metadata
        });
        
        return {
          ...result,
          phone: msg.phone
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const processedResults = batchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: 'Batch processing failed',
            phone: batch[index].phone
          };
        }
      });

      results.push(...processedResults);

      // Wait between batches to avoid rate limiting
      if (i + batchSize < messages.length) {
        await this.sleep(delay);
      }
    }

    return {
      total: messages.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Get SMS status
  async getSMSStatus(messageId: string): Promise<SMSMessage | null> {
    try {
      return await this.getSMSRecord(messageId);
    } catch {
      console.error('❌ Error getting SMS status:');
      return null;
    }
  }

  // Get user SMS statistics
  async getUserSMSStats(userId: string, days: number = 30): Promise<SMSStats> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Mock implementation - in reality, query database
      const stats: SMSStats = {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        deliveryRate: 0,
        totalCost: 0,
        recentMessages: []
      };

      console.log(`📊 SMS stats for user ${userId}:`, stats);
      
      return stats;
    } catch {
      console.error('❌ Error getting user SMS stats:');
      throw _error;
    }
  }

  // SMS templates
  private getSMSTemplate(templateType: string): SMSTemplate | null {
    const templates: { [key: string]: SMSTemplate } = {
      'contract_expiring': {
        type: 'contract_expiring',
        message: 'Merhaba {{userName}}, "{{contractTitle}}" sözleşmenizin süresi {{daysUntilExpiration}} gün içinde dolacak. Gerekli işlemleri yapmayı unutmayın. - Contravo',
        variables: ['userName', 'contractTitle', 'daysUntilExpiration']
      },
      'contract_expired': {
        type: 'contract_expired',
        message: 'Merhaba {{userName}}, "{{contractTitle}}" sözleşmenizin süresi dolmuştur. Lütfen gerekli işlemleri yapın. - Contravo',
        variables: ['userName', 'contractTitle']
      },
      'approval_needed': {
        type: 'approval_needed',
        message: 'Merhaba {{userName}}, "{{contractTitle}}" sözleşmesi onayınızı bekliyor. Lütfen platformdan inceleyin. - Contravo',
        variables: ['userName', 'contractTitle']
      },
      'approval_received': {
        type: 'approval_received',
        message: 'Merhaba {{userName}}, "{{contractTitle}}" sözleşmeniz {{approverName}} tarafından onaylandı. - Contravo',
        variables: ['userName', 'contractTitle', 'approverName']
      },
      'verification_code': {
        type: 'verification_code',
        message: 'Contravo doğrulama kodunuz: {{code}}. Bu kodu kimseyle paylaşmayın. Kod 5 dakika geçerlidir.',
        variables: ['code']
      },
      'password_reset': {
        type: 'password_reset',
        message: 'Merhaba {{userName}}, şifre sıfırlama talebiniz alındı. Platform üzerinden yeni şifrenizi oluşturabilirsiniz. - Contravo',
        variables: ['userName']
      },
      'welcome': {
        type: 'welcome',
        message: 'Merhaba {{userName}}, Contravo\'ya hoş geldiniz! Sözleşme yönetiminiz artık çok daha kolay olacak. - Contravo',
        variables: ['userName']
      }
    };

    return templates[templateType] || null;
  }

  // Provider implementations
  private async sendViaTwilio(smsMessage: SMSMessage): Promise<{
    success: boolean;
    providerId?: string;
    error?: string;
    cost?: number;
  }> {
    try {
      // Twilio integration would go here
      console.log('📱 Sending via Twilio (mock):', smsMessage.phone);
      
      // Mock successful response
      return {
        success: true,
        providerId: `twilio_${Date.now()}`,
        cost: 0.05 // Mock cost in USD
      };
    } catch {
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Twilio error'
      };
    }
  }

  private async sendViaVonage(smsMessage: SMSMessage): Promise<{
    success: boolean;
    providerId?: string;
    error?: string;
    cost?: number;
  }> {
    try {
      // Vonage (Nexmo) integration would go here
      console.log('📱 Sending via Vonage (mock):', smsMessage.phone);
      
      return {
        success: true,
        providerId: `vonage_${Date.now()}`,
        cost: 0.04
      };
    } catch {
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Vonage error'
      };
    }
  }

  private async sendViaAWSSNS(smsMessage: SMSMessage): Promise<{
    success: boolean;
    providerId?: string;
    error?: string;
    cost?: number;
  }> {
    try {
      // AWS SNS integration would go here
      console.log('📱 Sending via AWS SNS (mock):', smsMessage.phone);
      
      return {
        success: true,
        providerId: `sns_${Date.now()}`,
        cost: 0.06
      };
    } catch {
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'AWS SNS error'
      };
    }
  }

  private async sendViaMock(smsMessage: SMSMessage): Promise<{
    success: boolean;
    providerId?: string;
    error?: string;
    cost?: number;
  }> {
    console.log('📱 Mock SMS sent to:', smsMessage.phone);
    console.log('📱 Message:', smsMessage.message);
    
    return {
      success: true,
      providerId: `mock_${Date.now()}`,
      cost: 0.01
    };
  }

  // Utility methods
  private validatePhoneNumber(phone: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private processTemplate(template: string, variables: { [key: string]: string }): string {
    let processed = template;
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    return processed;
  }

  private getProviderFromConfig(): SMSProvider {
    const provider = process.env.SMS_PROVIDER?.toUpperCase();
    switch (provider) {
      case 'TWILIO':
        return SMSProvider.TWILIO;
      case 'VONAGE':
        return SMSProvider.VONAGE;
      case 'AWS_SNS':
        return SMSProvider.AWS_SNS;
      case 'FIREBASE':
        return SMSProvider.FIREBASE;
      default:
        return SMSProvider.MOCK;
    }
  }

  private loadProviderConfig(): void {
    switch (this.provider) {
      case SMSProvider.TWILIO:
        this.config = {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.TWILIO_FROM_NUMBER
        };
        break;
      case SMSProvider.VONAGE:
        this.config = {
          apiKey: process.env.VONAGE_API_KEY,
          apiSecret: process.env.VONAGE_API_SECRET,
          from: process.env.VONAGE_FROM_NUMBER
        };
        break;
      case SMSProvider.AWS_SNS:
        this.config = {
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        };
        break;
      default:
        this.config = {};
    }
  }

  // Database operations (mock implementations)
  private async saveSMSRecord(smsMessage: SMSMessage): Promise<void> {
    console.log('💾 Saving SMS record:', smsMessage.id);
    // In real implementation, save to database
  }

  private async updateSMSRecord(smsMessage: SMSMessage): Promise<void> {
    console.log('📝 Updating SMS record:', smsMessage.id);
    // In real implementation, update database record
  }

  private async getSMSRecord(messageId: string): Promise<SMSMessage | null> {
    console.log('📂 Getting SMS record:', messageId);
    // In real implementation, get from database
    return null;
  }

  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Webhook handler for delivery status updates
  async handleDeliveryWebhook(
    provider: string,
     
    webhookData: any
  ): Promise<void> {
    try {
      console.log(`📨 Processing SMS webhook from ${provider}:`, webhookData);
      
      // Process webhook data based on provider
      switch (provider.toLowerCase()) {
        case 'twilio':
          await this.processTwilioWebhook(webhookData);
          break;
        case 'vonage':
          await this.processVonageWebhook(webhookData);
          break;
        case 'aws':
          await this.processAWSWebhook(webhookData);
          break;
        default:
          console.log('Unknown SMS provider webhook:', provider);
      }
    } catch {
      console.error('❌ Error processing SMS webhook:');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processTwilioWebhook(data: any): Promise<void> {
    // Process Twilio delivery receipt
    if (data.MessageStatus && data.MessageSid) {
      const status = this.mapTwilioStatus(data.MessageStatus);
      if (status) {
        // Update SMS record status
        console.log(`📝 Updating SMS ${data.MessageSid} status to ${status}`);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processVonageWebhook(data: any): Promise<void> {
    // Process Vonage delivery receipt
    if (data.status && data['message-id']) {
      const status = this.mapVonageStatus(data.status);
      if (status) {
        console.log(`📝 Updating SMS ${data['message-id']} status to ${status}`);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processAWSWebhook(data: any): Promise<void> {
    // Process AWS SNS delivery receipt
    console.log('📨 Processing AWS SNS webhook:', data);
  }

  private mapTwilioStatus(status: string): SMSStatus | null {
    const mapping: { [key: string]: SMSStatus } = {
      'sent': SMSStatus.SENT,
      'delivered': SMSStatus.DELIVERED,
      'failed': SMSStatus.FAILED,
      'undelivered': SMSStatus.FAILED
    };
    return mapping[status] || null;
  }

  private mapVonageStatus(status: string): SMSStatus | null {
    const mapping: { [key: string]: SMSStatus } = {
      'delivered': SMSStatus.DELIVERED,
      'failed': SMSStatus.FAILED,
      'rejected': SMSStatus.REJECTED
    };
    return mapping[status] || null;
  }
}

// Singleton instance
export const smsService = SMSService.getInstance();

// Helper functions
export async function sendSMS(data: SMSJobData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return smsService.sendSMS(data);
}

export async function sendTemplatedSMS(
  templateType: string,
  phone: string,
  variables: { [key: string]: string },
  options?: {
    userId?: string;
    contractId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return smsService.sendTemplatedSMS(templateType, phone, variables, options);
} 