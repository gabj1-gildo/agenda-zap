import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userSubscriptions, plans } from '@/db/schema';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID missing' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { userTenants, invoices } = await import('@/db/schema');
    const { and, inArray, desc } = await import('drizzle-orm');

    // Para SUPERADMINs ou para qualquer um, a assinatura é ligada ao usuário dono do tenant.
    // Vamos buscar os usuários deste tenant.
    const tenantUsersList = await db.query.userTenants.findMany({
      where: eq(userTenants.tenantId, tenantId)
    });
    const tenantUserIds = tenantUsersList.map(tu => tu.userId);

    let subscription = null;
    let targetUserId = user.id;

    if (tenantUserIds.length > 0) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: inArray(userSubscriptions.userId, tenantUserIds),
        orderBy: (subs, { desc }) => [desc(subs.updatedAt)],
        with: { plan: true }
      });
      if (subscription) targetUserId = subscription.userId;
    }

    // Fallback caso não tenha achado pelo tenant (ex: tenant sem usuários)
    if (!subscription) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, user.id),
        with: { plan: true }
      });
    }

    const pendingInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.userId, targetUserId),
        eq(invoices.status, 'PENDING')
      )
    });

    const { chatSessions } = await import('@/db/schema');
    const { count, gte } = await import('drizzle-orm');

    let usage = {
      tenants: 1,
      users: 1,
      chats: 0
    };

    if (subscription && subscription.plan) {
      const userTenantsCount = await db.query.userTenants.findMany({
        where: eq(userTenants.userId, targetUserId)
      });
      usage.tenants = userTenantsCount.length;
      
      const userTenantIds = userTenantsCount.map(ut => ut.tenantId);

      if (userTenantIds.length > 0) {
        const usersInTenants = await db.query.userTenants.findMany({
          where: inArray(userTenants.tenantId, userTenantIds)
        });
        const uniqueUserIds = new Set(usersInTenants.map(ut => ut.userId));
        usage.users = uniqueUserIds.size;

        let periodStart = new Date();
        if (subscription.currentPeriodEnd) {
           periodStart = new Date(subscription.currentPeriodEnd);
           if (subscription.plan.interval === 'yearly') {
             periodStart.setFullYear(periodStart.getFullYear() - 1);
           } else {
             periodStart.setMonth(periodStart.getMonth() - 1);
           }
        } else {
           periodStart.setDate(periodStart.getDate() - 30);
        }

        const chatsQuery = await db.select({ value: count() }).from(chatSessions).where(
          and(
            inArray(chatSessions.tenantId, userTenantIds),
            gte(chatSessions.createdAt, periodStart)
          )
        );
        usage.chats = chatsQuery[0].value;
      }
    }

    return NextResponse.json({ success: true, data: { subscription, invoices: pendingInvoices, usage } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
