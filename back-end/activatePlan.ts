import { db } from './src/db';
import { tenants, tenantUsers, users, plans, userSubscriptions } from './src/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('Searching for tenant "Lucas Ramos"...');
  
  const foundTenants = await db.query.tenants.findMany({
    where: ilike(tenants.name, '%Lucas Ramos%')
  });

  if (foundTenants.length === 0) {
    console.log('Tenant not found');
    process.exit(1);
  }

  const tenant = foundTenants[0];
  console.log(`Found tenant: ${tenant.name} (ID: ${tenant.id})`);

  const tenantUsersList = await db.query.tenantUsers.findMany({
    where: eq(tenantUsers.tenantId, tenant.id)
  });

  const ownerTenantUser = tenantUsersList.find(tu => tu.role === 'ADMIN' || tu.role === 'SUPERADMIN') || tenantUsersList[0];
  
  if (!ownerTenantUser) {
    console.log('No user found for this tenant');
    process.exit(1);
  }

  const userRes = await db.query.users.findFirst({
    where: eq(users.id, ownerTenantUser.userId)
  });

  if (!userRes) {
    console.log('User not found');
    process.exit(1);
  }

  const user = userRes;
  console.log(`Associated user: ${user.name} (${user.email}) - ID: ${user.id}`);

  console.log('Searching for basic plan...');
  const foundPlans = await db.query.plans.findMany({
    where: ilike(plans.name, '%Básico%')
  });

  if (foundPlans.length === 0) {
    console.log('Basic plan not found');
    process.exit(1);
  }

  const basicPlan = foundPlans[0];
  console.log(`Found basic plan: ${basicPlan.name} (ID: ${basicPlan.id})`);

  console.log('Checking for existing subscription...');
  const existingSub = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, user.id)
  });

  if (existingSub) {
    console.log('Updating existing subscription...');
    await db.update(userSubscriptions)
      .set({
        planId: basicPlan.id,
        status: 'ACTIVE',
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, existingSub.id));
    console.log('Updated!');
  } else {
    console.log('Creating new subscription...');
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
    console.log('Created!');
  }
  
  console.log('Done.');
  process.exit(0);
}

main().catch(console.error);
