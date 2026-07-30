import { processBillingRenewals } from './services/billingService';

async function run() {
  console.log("Simulating first run...");
  const firstRun = await processBillingRenewals(new Date('2026-08-01'));
  console.log("First run result:", firstRun);
  
  console.log("Simulating second run (idempotency check)...");
  const secondRun = await processBillingRenewals(new Date('2026-08-01'));
  console.log("Second run result:", secondRun);
  
  process.exit(0);
}

run().catch(console.error);
