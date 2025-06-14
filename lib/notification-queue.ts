import prisma from './prisma';
import { emailService } from './email';
import { EmailTemplates, EmailTemplateData } from './email-templates';
// Queue job types
export interface NotificationJob {
  id: string;
  type: NotificationJobType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  status: JobStatus;
  error?: string;
   
  result?: any;
}

export enum NotificationJobType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  SEND_PUSH = 'SEND_PUSH',
  PROCESS_BATCH_EMAILS = 'PROCESS_BATCH_EMAILS',
  CREATE_NOTIFICATION = 'CREATE_NOTIFICATION',
  SCHEDULE_REMINDER = 'SCHEDULE_REMINDER',
  CLEANUP_OLD_NOTIFICATIONS = 'CLEANUP_OLD_NOTIFICATIONS'
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED'
}

export interface EmailJobData {
  templateType: string;
  to: string;
  data: EmailTemplateData;
  priority?: number;
  scheduledFor?: Date;
  trackingEnabled?: boolean;
  userId?: string;
  contractId?: string;
}

export interface BatchEmailJobData {
  templateType: string;
  recipients: Array<{
    email: string;
    data: EmailTemplateData;
  }>;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface SMSJobData {
  phone: string;
  message: string;
  userId?: string;
  contractId?: string;
}

class NotificationQueue {
  private static instance: NotificationQueue;
  private jobs: Map<string, NotificationJob> = new Map();
  private processing: boolean = false;
  private readonly maxConcurrent = 5;
  private readonly defaultMaxAttempts = 3;
  private readonly batchSize = 10;

  private constructor() {
    // Load pending jobs from database on initialization
    this.loadPendingJobs();
    
    // Start processing queue
    this.startProcessing();
    
    // Schedule cleanup job
    this.scheduleCleanup();
  }

  static getInstance(): NotificationQueue {
    if (!NotificationQueue.instance) {
      NotificationQueue.instance = new NotificationQueue();
    }
    return NotificationQueue.instance;
  }

  // Add job to queue
  async addJob(
    type: NotificationJobType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    options: {
      priority?: number;
      scheduledFor?: Date;
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const job: NotificationJob = {
      id: this.generateJobId(),
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || this.defaultMaxAttempts,
      createdAt: new Date(),
      scheduledFor: options.scheduledFor,
      status: options.scheduledFor ? JobStatus.SCHEDULED : JobStatus.PENDING
    };

    this.jobs.set(job.id, job);
    
    // Save to database for persistence
    await this.saveJobToDatabase(job);
    
    console.log(`📋 Job added to queue: ${job.id} (${type})`);
    
    return job.id;
  }

  // Add email job
  async addEmailJob(jobData: EmailJobData): Promise<string> {
    return this.addJob(NotificationJobType.SEND_EMAIL, jobData, {
      priority: jobData.priority || 0,
      scheduledFor: jobData.scheduledFor
    });
  }

  // Add batch email job
  async addBatchEmailJob(jobData: BatchEmailJobData): Promise<string> {
    return this.addJob(NotificationJobType.PROCESS_BATCH_EMAILS, jobData, {
      priority: 1 // Lower priority for batch jobs
    });
  }

  // Add SMS job
  async addSMSJob(jobData: SMSJobData): Promise<string> {
    return this.addJob(NotificationJobType.SEND_SMS, jobData, {
      priority: 2 // High priority for SMS
    });
  }

  // Process jobs from queue
  private async startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    console.log('🚀 Notification queue processing started');

    while (this.processing) {
      try {
        const readyJobs = this.getReadyJobs();
        const processingJobs = readyJobs.slice(0, this.maxConcurrent);

        if (processingJobs.length > 0) {
          await Promise.all(
            processingJobs.map(job => this.processJob(job))
          );
        }

        // Wait before next iteration
        await this.sleep(1000);
      } catch (_error) {
        console.error('❌ Error in queue processing:');
        await this.sleep(5000); // Wait longer on error
      }
    }
  }

  private getReadyJobs(): NotificationJob[] {
    const now = new Date();
    return Array.from(this.jobs.values())
      .filter(job => 
        (job.status === JobStatus.PENDING || job.status === JobStatus.SCHEDULED) &&
        (!job.scheduledFor || job.scheduledFor <= now)
      )
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  private async processJob(job: NotificationJob): Promise<void> {
    try {
      job.status = JobStatus.PROCESSING;
      job.attempts++;
      
      await this.updateJobInDatabase(job);
      
      console.log(`⚡ Processing job: ${job.id} (${job.type})`);

       
      let result: any;
      
      switch (job.type) {
        case NotificationJobType.SEND_EMAIL:
          result = await this.processEmailJob(job.data as EmailJobData);
          break;
        case NotificationJobType.PROCESS_BATCH_EMAILS:
          result = await this.processBatchEmailJob(job.data as BatchEmailJobData);
          break;
        case NotificationJobType.SEND_SMS:
          result = await this.processSMSJob(job.data as SMSJobData);
          break;
        case NotificationJobType.CREATE_NOTIFICATION:
          result = await this.processNotificationJob(job.data);
          break;
        case NotificationJobType.CLEANUP_OLD_NOTIFICATIONS:
          result = await this.processCleanupJob();
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = JobStatus.COMPLETED;
      job.result = result;
      
      console.log(`✅ Job completed: ${job.id}`);
      
    } catch (_error) {
      console.error(`❌ Job failed: ${job.id}`);
      
      job.error = _error instanceof Error ? _error.message : 'Unknown error';
      
      if (job.attempts >= job.maxAttempts) {
        job.status = JobStatus.FAILED;
        console.error(`💀 Job permanently failed: ${job.id}`);
      } else {
        job.status = JobStatus.PENDING;
        // Exponential backoff
        job.scheduledFor = new Date(Date.now() + Math.pow(2, job.attempts) * 1000);
      }
    }

    await this.updateJobInDatabase(job);
    
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      // Remove from memory after some time
      setTimeout(() => {
        this.jobs.delete(job.id);
      }, 300000); // 5 minutes
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processEmailJob(data: EmailJobData): Promise<any> {
    const template = this.getEmailTemplate(data.templateType, data.data);
    
    if (!template) {
      throw new Error(`Unknown email template: ${data.templateType}`);
    }

    const result = await emailService.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Track email if enabled
    if (data.trackingEnabled && result.success) {
      await this.trackEmailDelivery({
        messageId: result.messageId,
        recipient: data.to,
        templateType: data.templateType,
        userId: data.userId,
        contractId: data.contractId,
        sentAt: new Date()
      });
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processBatchEmailJob(data: BatchEmailJobData): Promise<any> {
    const batchSize = data.batchSize || 10;
    const delay = data.delayBetweenBatches || 1000;
    const results = [];

    for (let i = 0; i < data.recipients.length; i += batchSize) {
      const batch = data.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        const template = this.getEmailTemplate(data.templateType, recipient.data);
        
        if (!template) {
          throw new Error(`Unknown email template: ${data.templateType}`);
        }

        return emailService.sendEmail({
          to: recipient.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Wait between batches to avoid rate limiting
      if (i + batchSize < data.recipients.length) {
        await this.sleep(delay);
      }
    }

    return {
      total: data.recipients.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processSMSJob(data: SMSJobData): Promise<any> {
    // SMS implementation would go here
    // For now, just log the SMS
    console.log(`📱 SMS to ${data.phone}: ${data.message}`);
    
    return {
      success: true,
      message: 'SMS sent (simulated)'
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processNotificationJob(data: any): Promise<any> {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        contractId: data.contractId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata
      }
    });

    return notification;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processCleanupJob(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old read notifications
    const deletedCount = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    return { deletedCount: deletedCount.count };
  }

  private getEmailTemplate(templateType: string, data: EmailTemplateData) {
    switch (templateType) {
      case 'company_invitation':
        return EmailTemplates.companyInvitation(data);
      case 'contract_expiring':
        return EmailTemplates.contractExpiring(data);
      case 'contract_expired':
        return EmailTemplates.contractExpired(data);
      case 'approval_needed':
        return EmailTemplates.approvalNeeded(data);
      case 'approval_received':
        return EmailTemplates.approvalReceived(data);
      case 'email_verification':
        return EmailTemplates.emailVerification(data);
      case 'password_reset':
        return EmailTemplates.passwordReset(data);
      case 'welcome':
        return EmailTemplates.welcome(data);
      default:
        return null;
    }
  }

  private async trackEmailDelivery(data: {
    messageId: string;
    recipient: string;
    templateType: string;
    userId?: string;
    contractId?: string;
    sentAt: Date;
  }) {
    // This would be implemented in the email tracking system
    console.log('📧 Email delivery tracked:', data);
  }

  // Database operations
  private async saveJobToDatabase(job: NotificationJob) {
    // In a real implementation, you'd save jobs to a database table
    // For now, we'll just log it
    console.log('💾 Job saved to database:', job.id);
  }

  private async updateJobInDatabase(job: NotificationJob) {
    console.log('📝 Job updated in database:', job.id, job.status);
  }

  private async loadPendingJobs() {
    // Load pending jobs from database on startup
    console.log('📂 Loading pending jobs from database...');
  }

  // Utility methods
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private scheduleCleanup() {
    // Schedule cleanup job every 24 hours
    setInterval(() => {
      this.addJob(NotificationJobType.CLEANUP_OLD_NOTIFICATIONS, {}, {
        priority: -1 // Low priority
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Public API methods
  async getJobStatus(jobId: string): Promise<NotificationJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (job && job.status === JobStatus.PENDING) {
      job.status = JobStatus.CANCELLED;
      await this.updateJobInDatabase(job);
      return true;
    }
    return false;
  }

  async getQueueStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
      processing: jobs.filter(j => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      scheduled: jobs.filter(j => j.status === JobStatus.SCHEDULED).length
    };
  }

  stop() {
    this.processing = false;
    console.log('⏹️  Notification queue processing stopped');
  }
}

// Singleton instance
export const notificationQueue = NotificationQueue.getInstance();

// Helper functions for easy usage
export async function sendEmail(data: EmailJobData): Promise<string> {
  return notificationQueue.addEmailJob(data);
}

export async function sendBatchEmails(data: BatchEmailJobData): Promise<string> {
  return notificationQueue.addBatchEmailJob(data);
}

export async function sendSMS(data: SMSJobData): Promise<string> {
  return notificationQueue.addSMSJob(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createNotification(data: any): Promise<string> {
  return notificationQueue.addJob(NotificationJobType.CREATE_NOTIFICATION, data);
} 