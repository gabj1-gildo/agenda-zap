import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from './src/lib/password';

async function testPassword() {
  const [user] = await db.select().from(users).where(eq(users.email, 'gildoalves794@gmail.com'));
  if (!user) return console.log("User not found");
  
  console.log("Testing password '9?tp22Xn' against hash...");
  const isValid = await verifyPassword(user.passwordHash, '9?tp22Xn');
  console.log("Is valid?", isValid);
  
  process.exit(0);
}

testPassword().catch(console.error);
