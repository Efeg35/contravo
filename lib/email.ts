import nodemailer from 'nodemailer';
import { trackEmailDelivery } from './email-tracking';
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  trackingEnabled?: boolean;
  userId?: string;
  contractId?: string;
  templateType?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Production'da gerçek SMTP ayarları kullanılır
    // Development için console'a log yazdırıyoruz
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  async sendEmail({ to, subject, html, text, trackingEnabled = false, userId, contractId, templateType }: EmailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@contravo.com',
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      console.log('📧 Email sent:', {
        to,
        subject,
        messageId: info.messageId,
      });

      // Track email delivery if enabled
      if (trackingEnabled && info.messageId) {
        try {
          await trackEmailDelivery({
            messageId: info.messageId,
            recipient: to,
            templateType: templateType || 'unknown',
            userId,
            contractId,
            sentAt: new Date()
          });
        } catch (trackingError) {
          console.error('❌ Email tracking failed:');
          // Don't fail the email send if tracking fails
        }
      }

      return { success: true, messageId: info.messageId };
    } catch (_error) {
      console.error('❌ Email send failed:');
      return { success: false, error: _error instanceof Error ? _error.message : 'Unknown error' };
    }
  }

  private htmlToText(html: string): string {
    // Basit HTML -> text dönüşümü
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  async sendCompanyInvitation({
    email,
    companyName,
    inviterName,
    role,
    inviteUrl,
  }: {
    email: string;
    companyName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
  }) {
    const roleText = role === 'ADMIN' ? 'Yönetici' : 'Üye';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Şirket Daveti - Contravo</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 Şirket Daveti</h1>
              <p>Contravo'da bir şirkete katılmaya davet edildiniz</p>
            </div>
            
            <div class="content">
              <h2>Merhaba!</h2>
              
              <p><strong>${inviterName}</strong> sizi <strong>${companyName}</strong> şirketine <strong>${roleText}</strong> olarak katılmaya davet etti.</p>
              
              <p>Daveti kabul etmek için aşağıdaki butona tıklayın:</p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Daveti Kabul Et</a>
              </div>
              
              <p><small>Bu link 7 gün sonra geçersiz olacaktır.</small></p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p><strong>Contravo Nedir?</strong></p>
              <p>Contravo, şirketlerin sözleşmelerini kolayca yönetebileceği modern bir platformdur. Şirketinizde:</p>
              <ul>
                <li>📄 Sözleşmeleri oluşturabilir ve yönetebilirsiniz</li>
                <li>👥 Ekip üyeleriyle işbirliği yapabilirsiniz</li>
                <li>📊 Detaylı raporlar alabilirsiniz</li>
                <li>🔔 Önemli tarihler için hatırlatma alabilirsiniz</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Bu email otomatik olarak gönderilmiştir.</p>
              <p>© 2024 Contravo. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `${companyName} şirketine davet edildiniz - Contravo`,
      html,
    });
  }
}

export const emailService = new EmailService(); 