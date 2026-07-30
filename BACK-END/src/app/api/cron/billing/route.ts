import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { processBillingRenewals } from '@/services/billingService';

// Rota protegida por CRON_SECRET no Vercel/Render ou pode ser chamada via API
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processBillingRenewals();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron billing error:", error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
