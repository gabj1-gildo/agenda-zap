import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userSubscriptions } from '@/db/schema';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateAsaasSubscriptionCard } from '@/services/payments/asaas/saas';

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID missing' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { creditCard, creditCardHolderInfo } = body;

    if (!creditCard || !creditCardHolderInfo) {
      return NextResponse.json({ success: false, error: 'Dados do cartão incompletos' }, { status: 400 });
    }

    const { userTenants } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    // Buscar a assinatura ativa para os usuários do tenant
    const tenantUsersList = await db.query.userTenants.findMany({
      where: eq(userTenants.tenantId, tenantId)
    });
    const tenantUserIds = tenantUsersList.map(tu => tu.userId);

    let subscription = null;
    if (tenantUserIds.length > 0) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: inArray(userSubscriptions.userId, tenantUserIds),
        orderBy: (subs, { desc }) => [desc(subs.updatedAt)]
      });
    }

    if (!subscription) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, user.id)
      });
    }

    if (!subscription || !subscription.asaasSubscriptionId) {
      return NextResponse.json({ success: false, error: 'Assinatura via cartão não encontrada' }, { status: 404 });
    }

    // Atualiza o cartão de crédito no Asaas
    await updateAsaasSubscriptionCard(
      subscription.asaasSubscriptionId, 
      creditCard, 
      creditCardHolderInfo
    );

    return NextResponse.json({ success: true, message: 'Cartão de crédito atualizado com sucesso' });
  } catch (error: any) {
    console.error('[SAAS PAYMENT METHOD UPDATE ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno ao atualizar método de pagamento' }, { status: 500 });
  }
}
