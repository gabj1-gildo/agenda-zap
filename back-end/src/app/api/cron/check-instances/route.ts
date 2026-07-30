import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { isNotNull, eq } from 'drizzle-orm';
import { env } from '@/config/env';

const EVOLUTION_URL = env.EVOLUTION_API_URL ? env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
const EVOLUTION_KEY = env.EVOLUTION_API_KEY || '';
const CRON_SECRET = env.CRON_SECRET || 'my-super-secret-cron-key';

export async function processCheckInstances() {
  try {
    if (!EVOLUTION_URL) {
      return { success: false, error: 'EVOLUTION_API_URL não configurada no ambiente' };
    }

    // 1. Buscar todos os tenants que têm instância configurada
    const allTenants = await db.query.tenants.findMany({
      where: isNotNull(tenants.evolutionInstanceName)
    });

    if (allTenants.length === 0) {
      return { success: true, message: 'Nenhuma instância para checar.' };
    }

    let updatedCount = 0;

    // 2. Fazer requests em paralelo para checar o status de cada um
    const checks = allTenants.map(async (tenant) => {
      if (!tenant.evolutionInstanceName) return;

      try {
        const statusRes = await fetch(
          `${EVOLUTION_URL}/instance/connectionState/${tenant.evolutionInstanceName}`,
          { headers: { apikey: EVOLUTION_KEY } }
        );
        const statusData = await statusRes.json();
        
        // Se a instância não existe na API ou está desconectada, o state pode vir vazio ou com erro
        const state: string = statusData?.instance?.state || 'DISCONNECTED';
        const normalizedState = state.toUpperCase();

        // Só atualiza se o status for diferente do banco
        if (tenant.evolutionInstanceStatus !== normalizedState) {
          await db.update(tenants)
            .set({ evolutionInstanceStatus: normalizedState, updatedAt: new Date() })
            .where(eq(tenants.id, tenant.id));
          updatedCount++;
        }
      } catch (err) {
        console.error(`Erro ao checar status da instância ${tenant.evolutionInstanceName}:`, err);
        // Se a API não respondeu, podemos assumir que está offline/desconectado ou ignorar.
        // Por segurança, se não conseguiu checar, não alteramos o status ou marcamos como DISCONNECTED.
        if (tenant.evolutionInstanceStatus !== 'DISCONNECTED') {
           await db.update(tenants)
            .set({ evolutionInstanceStatus: 'DISCONNECTED', updatedAt: new Date() })
            .where(eq(tenants.id, tenant.id));
           updatedCount++;
        }
      }
    });

    await Promise.all(checks);

    return { 
      success: true, 
      message: `Verificação concluída. ${updatedCount} status atualizado(s).`,
      totalChecked: allTenants.length
    };
  } catch (error) {
    console.error('Erro no processCheckInstances:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const querySecret = url.searchParams.get('secret');

    // Permitir chamada via Header Bearer ou Query param ?secret=...
    const providedSecret = (authHeader && authHeader.startsWith('Bearer ')) 
      ? authHeader.split(' ')[1] 
      : querySecret;

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processCheckInstances();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Erro no cron check-instances:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
