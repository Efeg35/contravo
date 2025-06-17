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