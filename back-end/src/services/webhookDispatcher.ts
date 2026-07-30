import { db } from '@/db';
import { tenantWebhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export type WebhookEvent = 'APPOINTMENT_CREATED' | 'APPOINTMENT_CANCELED' | 'APPOINTMENT_RESCHEDULED' | 'PAYMENT_RECEIVED';

export async function dispatchWebhook(tenantId: string, eventType: WebhookEvent, payload: any) {
  try {
    // Busca URLs ativas do tenant que escutam esse evento
    const hooks = await db.select().from(tenantWebhooks).where(
      and(
        eq(tenantWebhooks.tenantId, tenantId),
        eq(tenantWebhooks.isActive, true)
      )
    );

    for (const hook of hooks) {
      if (hook.events && hook.events.length > 0 && !hook.events.includes(eventType)) {
         continue; // Nao escuta este evento
      }

      const bodyString = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (hook.secret) {
        const hmac = crypto.createHmac('sha256', hook.secret);
        const signature = hmac.update(bodyString).digest('hex');
        headers['X-AgendaZap-Signature'] = `sha256=${signature}`;
      }

      // Disparo assíncrono real-time (fire and forget)
      fetch(hook.url, {
        method: 'POST',
        headers,
        body: bodyString
      }).catch(err => {
        console.error(`Failed to dispatch webhook to ${hook.url}:`, err.message);
      });
    }
  } catch (error) {
    console.error('Error in webhookDispatcher:', error);
  }
}
