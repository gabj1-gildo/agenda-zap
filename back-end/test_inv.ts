import { db } from './src/db';
async function main() {
  await db.query.invoices.findMany({ limit: 1 });
  console.log('Invoices OK');
  process.exit(0);
}
main();
