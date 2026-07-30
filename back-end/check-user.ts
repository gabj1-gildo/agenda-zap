import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { env } from './src/config/env';

async function checkUser() {
  console.log("Checking user...");
  const [user] = await db.select().from(users).where(eq(users.email, 'gildoalves794@gmail.com'));
  if (user) {
    console.log("User found:");
    console.log("ID:", user.id);
    console.log("Email:", user.email);
    console.log("Status:", user.status);
    console.log("Failed Attempts:", user.failedLoginAttempts);
    console.log("Locked Until:", user.lockedUntil);
    console.log("PasswordHash exists?", !!user.passwordHash);
  } else {
    console.log("User not found!");
  }
  process.exit(0);
}

checkUser().catch(console.error);
