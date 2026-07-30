import { Resend } from 'resend';
import { env } from '@/config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : { emails: { send: async () => ({ data: null, error: 'No API Key' }) } } as unknown as Resend;
const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Email not sent.');
    return { success: false, error: 'Email configuration missing' };
  }

  try {
    const data = await resend.emails.send({
      from: `AgendaZap <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (data.error) {
      console.error('Resend error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
