import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, tenantUsers, users, plans, userSubscriptions } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const foundTenants = await db.query.tenants.findMany({
      where: ilike(tenants.name, '%Lucas Ramos%')
    });

    if (foundTenants.length === 0) {
      return NextResponse.json({ success: false, message: 'Tenant not found' });
    }

    const tenant = foundTenants[0];

    const tenantUsersList = await db.query.tenantUsers.findMany({
      where: eq(tenantUsers.tenantId, tenant.id)
    });

    const ownerTenantUser = tenantUsersList.find(tu => tu.role === 'ADMIN' || tu.role === 'SUPERADMIN') || tenantUsersList[0];
    
    if (!ownerTenantUser) {
      return NextResponse.json({ success: false, message: 'No user found for this tenant' });
    }

    const userRes = await db.query.users.findFirst({
      where: eq(users.id, ownerTenantUser.userId)
    });

    if (!userRes) {
      return NextResponse.json({ success: false, message: 'User not found' });
    }

    const user = userRes;

    const foundPlans = await db.query.plans.findMany({
      where: ilike(plans.name, '%Básico%')
    });

    if (foundPlans.length === 0) {
      return NextResponse.json({ success: false, message: 'Basic plan not found' });
    }

    const basicPlan = foundPlans[0];

    const existingSub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, user.id)
    });

    if (existingSub) {
      await db.update(userSubscriptions)
        .set({
          planId: basicPlan.id,
          status: 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, existingSub.id));
    } else {
      await db.insert(userSubscriptions).values({
        id: uuidv4(),
        userId: user.id,
        planId: basicPlan.id,
        status: 'ACTIVE',
        asaasCustomerId: null,
        asaasSubscriptionId: null,
        trialEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year trial for testing
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ success: true, message: 'Plan activated for Lucas Ramos' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message });
  }
}
