import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './src/lib/password';

async function resetPassword() {
  const [user] = await db.select().from(users).where(eq(users.email, 'gildoalves794@gmail.com'));
  if (!user) return console.log("User not found");
  
  console.log("Resetting password to '9?tp22Xn'...");
  const newHash = await hashPassword('9?tp22Xn');
  await db.update(users).set({ passwordHash: newHash, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
  console.log("Password reset successfully!");
  
  process.exit(0);
}

resetPassword().catch(console.error);
