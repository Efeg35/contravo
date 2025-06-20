import { Resend } from 'resend';
import NotificationEmail from '@/components/emails/NotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendNotificationEmailParams {
  to: string;
  baslik: string;
  mesaj: string;
  link: string;
  linkText?: string;
}

interface SendReportEmailParams {
  to: string[];
  reportName: string;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
}

export async function sendNotificationEmail({
  to,
  baslik,
  mesaj,
  link,
  linkText,
}: SendNotificationEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Contravo <bildirim@contravo.com>',
      to,
      subject: baslik,
      react: NotificationEmail({
        baslik,
        mesaj,
        link,
        linkText,
      }),
    });

    if (error) {
      console.error('E-posta gönderme hatası:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
}

export async function sendReportEmail({
  to,
  reportName,
  attachments = [],
}: SendReportEmailParams) {
  try {
    const subject = `Zamanlanmış Rapor: ${reportName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Contravo Raporu</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Merhaba,</h2>
          
          <p style="color: #666; line-height: 1.6;">
            <strong>${reportName}</strong> adlı zamanlanmış raporunuz hazır! 
            Bu e-postanın ekinde PDF formatında raporunuzu bulabilirsiniz.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0; color: #333;">
              📎 <strong>Ek Dosya:</strong> ${attachments.length > 0 ? attachments[0].filename : 'Rapor.pdf'}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Bu rapor otomatik olarak oluşturulmuş ve gönderilmiştir. 
            Zamanlama ayarlarınızı değiştirmek için Contravo panelinizdeki 
            <strong>Raporlar</strong> bölümünü ziyaret edebilirsiniz.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://contravo.com/dashboard/reports" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              📈 Raporları Görüntüle
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Bu e-posta Contravo CLM sistemi tarafından otomatik olarak gönderilmiştir.<br>
            © 2024 Contravo - Sözleşme Yaşam Döngüsü Yönetimi
          </p>
        </div>
      </div>
    `;

    // Her alıcıya ayrı ayrı gönder
    const results = [];
    for (const recipient of to) {
      const emailData: any = {
        from: 'Contravo Raporlar <raporlar@contravo.com>',
        to: recipient,
        subject,
        html,
      };

      // Attachments varsa ekle
      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments;
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error(`E-posta gönderme hatası (${recipient}):`, error);
        results.push({ recipient, success: false, error });
      } else {
        console.log(`Rapor e-postası başarıyla gönderildi: ${recipient}`);
        results.push({ recipient, success: true, data });
      }
    }

    return { results };
  } catch (error) {
    console.error('Rapor e-postası gönderme hatası:', error);
    throw error;
  }
} 