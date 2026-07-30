import { db } from './index';
import { systemSettings } from './schema/systemSettings';

async function seedSettings() {
  console.log('Seeding system settings...');
  await db.insert(systemSettings).values({
    key: 'whatsapp_default_instance_name',
    value: 'whatsapp-vendas',
    description: 'Instância padrão do sistema para envios globais'
  }).onConflictDoNothing();
  
  await db.insert(systemSettings).values({
    key: 'whatsapp_default_api_key',
    value: '665D125A-9D3A-4FD2-B78C-CF4F23BD3A80',
    description: 'Token da instância padrão'
  }).onConflictDoNothing();
  console.log('Done.');
  process.exit(0);
}

seedSettings().catch(console.error);
