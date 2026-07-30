import { NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const tenantId = reqUrl.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const clientId = env.MERCADOPAGO_CLIENT_ID;
  const redirectUri = env.MP_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json({ error: "MP_REDIRECT_URI não configurado." }, { status: 500 });
  }

  if (!clientId) {
    return NextResponse.json({ error: 'MP_CLIENT_ID not configured in backend' }, { status: 500 });
  }

  const mpAuthUrl = new URL('https://auth.mercadopago.com/authorization');
  mpAuthUrl.searchParams.set('client_id', clientId);
  mpAuthUrl.searchParams.set('response_type', 'code');
  const pixExpirationTime = reqUrl.searchParams.get('pixExpirationTime') || '00:30';
  mpAuthUrl.searchParams.set('state', `${tenantId}|${pixExpirationTime}`);
  mpAuthUrl.searchParams.set('redirect_uri', redirectUri);

  return NextResponse.redirect(mpAuthUrl.toString());
}
