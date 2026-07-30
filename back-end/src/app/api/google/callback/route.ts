import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/config/env';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const tenantId = url.searchParams.get('state');

  if (!code || !tenantId || tenantId === 'default') {
    return NextResponse.json({ success: false, error: 'No code or tenantId provided' }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) throw new Error("Tenant not found");

    await db.update(tenants)
      .set({ 
        googleCalendarToken: JSON.stringify(tokens),
        updatedAt: new Date()
      })
      .where(eq(tenants.id, tenant.id));

    // Redirect de volta para a tela de configurações
    const frontendUrl = env.FRONTEND_URL;
    if (!frontendUrl) {
      return NextResponse.json({ error: "FRONTEND_URL não configurado" }, { status: 500 });
    }
    return NextResponse.redirect(`${frontendUrl}/settings`);
  } catch (error) {
    console.error('Error fetching Google token', error);
    return NextResponse.json({ success: false, error: 'Auth failed' }, { status: 500 });
  }
}
