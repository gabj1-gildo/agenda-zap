import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/password';

async function resetSuperadmin() {
  const [admin] = await db.select().from(users).where(eq(users.role, 'SUPERADMIN')).limit(1);
  if (!admin) {
    console.log('No superadmin found!');
    process.exit(1);
  }

  const newPassword = 'AdminPassword123!';
  const hashedPassword = await hashPassword(newPassword);

  await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, admin.id));
  console.log(`Password for ${admin.email} has been reset to: ${newPassword}`);
  process.exit(0);
}

resetSuperadmin().catch(err => {
  console.error(err);
  process.exit(1);
});
