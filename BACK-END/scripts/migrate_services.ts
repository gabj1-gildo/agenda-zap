import { db } from '../src/db';
import { tenants } from '../src/db/schema';
import { services } from '../src/db/schema/services';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Iniciando script de migração de serviços (DRY-RUN)...');
  
  const allTenants = await db.select().from(tenants);
  
  let totalServicesExtracted = 0;
  let successCount = 0;
  let manualReviewCount = 0;
  const reportLines: string[] = ['Tenant ID,Tenant Name,Service Name,Price,Duration,Duration Estimated,Status'];

  for (const tenant of allTenants) {
    const aiConfig = tenant.aiConfig as any;
    if (!aiConfig || !aiConfig.servicos_precos) {
      continue;
    }

    const text = aiConfig.servicos_precos;
    
    // Tenta fazer o parse básico (ex: Corte = R$50 | Barba = R$35)
    // Vamos quebrar por "|" ou "\n"
    const blocks = text.split(/\||\n/);
    
    let hasFailedParse = false;
    let extractedCount = 0;

    for (const block of blocks) {
      const cleanBlock = block.trim();
      if (!cleanBlock) continue;

      // Regex para pegar algo como "Nome do Serviço = R$ 50" ou "Nome - 50,00"
      const match = cleanBlock.match(/(.*?)(?:=|-|R\$)\s*(?:R\$)?\s*(\d+(?:[.,]\d+)?)/i);
      
      if (match && match[1] && match[2]) {
        const name = match[1].trim();
        const priceStr = match[2].replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (!isNaN(price) && name.length > 0) {
          // Por padrão, como o aiConfig não armazenava duração, assumimos 30 minutos
          const defaultDuration = 30;
          const durationEstimated = 'YES';

          reportLines.push(`${tenant.id},"${tenant.name}","${name}",${price},${defaultDuration},${durationEstimated},SUCCESS`);
          extractedCount++;
          totalServicesExtracted++;
          
          // No DRY-RUN não inserimos, mas se fôssemos inserir:
          // await db.insert(services).values({
          //   tenantId: tenant.id,
          //   name: name,
          //   price: price.toString(),
          //   durationMinutes: defaultDuration,
          //   isActive: true,
          // });
        } else {
          reportLines.push(`${tenant.id},"${tenant.name}","${cleanBlock}",0,0,NO,FAILED_PARSE`);
          hasFailedParse = true;
        }
      } else {
        reportLines.push(`${tenant.id},"${tenant.name}","${cleanBlock}",0,0,NO,FAILED_PARSE`);
        hasFailedParse = true;
      }
    }
    
    if (hasFailedParse) {
      manualReviewCount++;
    } else if (extractedCount > 0) {
      successCount++;
    }
  }

  const reportPath = path.join(__dirname, 'services_migration_report.csv');
  fs.writeFileSync(reportPath, reportLines.join('\n'));
  
  console.log(`\nMigração Finalizada (Modo Dry-Run)`);
  console.log(`- Total de serviços extraídos com sucesso: ${totalServicesExtracted}`);
  console.log(`- Tenants com parse 100% automático: ${successCount}`);
  console.log(`- Tenants com blocos que precisam de revisão manual: ${manualReviewCount}`);
  console.log(`Relatório detalhado salvo em: ${reportPath}`);
  console.log(`\nPara inserir os dados no banco, remova o comentário do 'db.insert' no código.`);
  
  process.exit(0);
}

run().catch(console.error);
