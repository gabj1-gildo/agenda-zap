import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { processIncomingMessage } from '@/services/chatProcessor';
import { downloadMetaMediaBase64 } from '@/services/metaCloudApi';

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'my_super_secret_verify_token';
const META_APP_SECRET = process.env.META_APP_SECRET || '';

// Verificação de segurança obrigatória da Meta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      console.log('META WEBHOOK VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return new NextResponse('Bad Request', { status: 400 });
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-hub-signature-256');
    const rawBody = await req.text();

    if (META_APP_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', META_APP_SECRET);
      const digest = 'sha256=' + hmac.update(rawBody).digest('hex');
      if (signature !== digest) {
        console.error('Invalid Meta webhook signature');
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('Not Found', { status: 404 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (value && value.messages && value.messages[0]) {
          const msg = value.messages[0];
          const phoneNumberId = value.metadata.phone_number_id;
          
          const remoteJid = msg.from; // Número do cliente

          // Localizar o Tenant por PhoneNumberId
          const tenantList = await db.select().from(tenants).where(eq(tenants.whatsappMetaPhoneNumberId, phoneNumberId));
          const tenant = tenantList[0];

          if (!tenant) {
            console.error('Tenant não encontrado para o PhoneNumberId:', phoneNumberId);
            continue;
          }

          let text = '';
          let mediaBase64: string | undefined = undefined;
          let mimeType: string | undefined = undefined;

          if (msg.type === 'text') {
            text = msg.text?.body || '';
          } else if (msg.type === 'image' || msg.type === 'audio') {
            const mediaId = msg.type === 'image' ? msg.image?.id : msg.audio?.id;
            if (msg.image?.caption) text = msg.image.caption;

            // Obter token permanente da Meta do Tenant
            const metaToken = tenant.whatsappMetaToken;
            if (metaToken && mediaId) {
              const downloaded = await downloadMetaMediaBase64(mediaId, metaToken);
              if (downloaded) {
                mediaBase64 = downloaded.base64;
                mimeType = downloaded.mimeType;
              }
            }
          } else {
             // Unsupported type
             continue;
          }

          if (!text && !mediaBase64) continue;

          const jidWithDomain = `${remoteJid}@s.whatsapp.net`;
          const pushName = value.contacts && value.contacts[0] ? value.contacts[0].profile.name : 'Cliente';
          
          await processIncomingMessage(jidWithDomain, pushName, text, tenant, mediaBase64, mimeType);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('Error handling Meta webhook:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
