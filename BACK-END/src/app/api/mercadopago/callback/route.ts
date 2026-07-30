import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentKeys, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '@/config/env';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || ''; // Passed in auth route
  const [tenantId, pixExpirationTime = '00:30'] = state.split('|');

  if (!code || !tenantId) {
    return NextResponse.json({ error: 'Code or tenantId missing' }, { status: 400 });
  }

  const clientId = env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = env.MERCADOPAGO_CLIENT_SECRET;
  const redirectUri = env.MP_REDIRECT_URI;
  if (!redirectUri) {
    console.error("MP_REDIRECT_URI não definido.");
    return NextResponse.json({ error: "Erro de configuração de ambiente" }, { status: 500 });
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Mercado Pago credentials not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch token from Mercado Pago
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("MP Token Error:", tokenData);
      return NextResponse.json({ error: 'Failed to authenticate with Mercado Pago' }, { status: 500 });
    }

    const accessToken = tokenData.access_token;
    
    // 2. Validate tenant
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Deactivate all other keys for this tenant
    await db.update(paymentKeys)
      .set({ isActive: false })
      .where(eq(paymentKeys.tenantId, tenantId));

    // 4. Save or update key in database
    const existingKeys = await db.query.paymentKeys.findMany({
      where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.gateway, 'MERCADOPAGO'))
    });

    if (existingKeys.length > 0) {
      await db.update(paymentKeys)
        .set({ token: accessToken, isActive: true, pixExpirationTime, updatedAt: new Date() })
        .where(eq(paymentKeys.id, existingKeys[0].id));
    } else {
      const formattedName = tenant.name ? `${tenant.name.replace(/\s+/g, '').toLowerCase()}_mp` : 'loja_mp';
      await db.insert(paymentKeys).values({
        tenantId: tenantId,
        name: formattedName,
        gateway: 'MERCADOPAGO',
        token: accessToken,
        isActive: true,
        pixExpirationTime,
      });
    }

    // 5. Redirect back to settings
    const frontendUrl = env.FRONTEND_URL;
    if (!frontendUrl) {
      return NextResponse.json({ error: "FRONTEND_URL não definido." }, { status: 500 });
    }
    return NextResponse.redirect(`${frontendUrl}/settings`);

  } catch (error) {
    console.error('Mercado Pago OAuth error', error);
    return NextResponse.json({ error: 'Server error during OAuth' }, { status: 500 });
  }
}
