import { db } from './src/db';
import { userTenants, userSubscriptions, users, plans } from './src/db/schema';
async function main() {
  const Gildo = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.email, 'gildoalves794@gmail.com') });
  console.log('Gildo ID:', Gildo?.id);
  const subs = await db.query.userSubscriptions.findMany({ where: (subs, { eq }) => eq(subs.userId, Gildo?.id) });
  console.log('Subs:', subs);
  
  const tenant = await db.query.tenants.findFirst({ where: (t, { ilike }) => ilike(t.name, '%Lucas Ramos%') });
  console.log('Tenant ID:', tenant?.id);
  const ut = await db.query.userTenants.findMany({ where: (ut, { eq }) => eq(ut.tenantId, tenant?.id) });
  console.log('UserTenants for Lucas Ramos:', ut);
  
  process.exit(0);
}
main();
