import { db } from './src/db';
import { userSubscriptions, plans, userTenants, invoices, chatSessions } from './src/db/schema';
import { eq, and, inArray, count, gte, desc } from 'drizzle-orm';

async function test() {
  try {
    console.log("Checking userTenants...");
    const tenantUsersList = await db.query.userTenants.findMany({
      limit: 1
    });
    console.log("userTenants ok");

    console.log("Checking userSubscriptions...");
    const subscription = await db.query.userSubscriptions.findFirst({
      with: { plan: true }
    });
    console.log("userSubscriptions ok");

    console.log("Checking invoices...");
    const pendingInvoices = await db.query.invoices.findMany({
      where: eq(invoices.status, 'PENDING'),
      limit: 1
    });
    console.log("invoices ok");

    console.log("Checking chatSessions...");
    const chatsQuery = await db.select({ value: count() }).from(chatSessions).limit(1);
    console.log("chatSessions ok");

    console.log("All queries passed successfully!");
  } catch (error) {
    console.error("Query failed:", error);
  }
}

test().then(() => process.exit(0));
