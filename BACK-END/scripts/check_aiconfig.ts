import { db } from '../src/db';
import { tenants } from '../src/db/schema/tenants';
import { sql } from 'drizzle-orm';

async function run() {
  const result = await db.select({
    id: tenants.id,
    aiConfig: tenants.aiConfig
  }).from(tenants);

  console.log(`Total de tenants: ${result.length}`);
  
  const tenantsWithAiConfig = result.filter(t => t.aiConfig);
  console.log(`Tenants com aiConfig: ${tenantsWithAiConfig.length}`);
  
  const tenantsWithServicos = tenantsWithAiConfig.filter(t => (t.aiConfig as any).servicos_precos);
  console.log(`Tenants com servicos_precos: ${tenantsWithServicos.length}`);

  if (tenantsWithServicos.length > 0) {
    console.log("Exemplo de servicos_precos:", (tenantsWithServicos[0].aiConfig as any).servicos_precos);
  }

  process.exit(0);
}
run();
