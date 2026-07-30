import 'dotenv/config';
import { db } from './src/db/index.js';
import { usersAdmin } from './src/db/schema/usersAdmin.js';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

if (!EVOLUTION_URL || !API_KEY || !INSTANCE) {
  console.error('❌ [ERRO] Variáveis de ambiente da Evolution API não estão definidas (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME).');
  process.exit(1);
}

async function diagnose() {
  console.log('======== DIAGNÓSTICO COMPLETO DO SISTEMA ========\n');

  // 1. Banco de Dados
  try {
    const tenants = await db.select().from(usersAdmin);
    console.log(`✅ [1] Banco de dados: OK (${tenants.length} tenant(s))`);
    if (tenants.length > 0) console.log(`   → Tenant: ${tenants[0].name} | ID: ${tenants[0].id}`);
  } catch (e) {
    console.error(`❌ [1] Banco de dados OFFLINE: ${e.message}`);
  }

  // 2. Evolution API
  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { apikey: API_KEY }
    });
    const data = await res.json();
    const state = data.instance?.state;
    const icon = state === 'open' ? '✅' : '⚠️';
    console.log(`\n${icon} [2] Evolution API: ONLINE | Estado: "${state}"`);
  } catch (e) {
    console.error(`\n❌ [2] Evolution API OFFLINE: ${e.message}`);
  }

  // 3. Webhook configurado na instância
  try {
    const res = await fetch(`${EVOLUTION_URL}/webhook/find/${INSTANCE}`, {
      headers: { apikey: API_KEY }
    });
    const data = await res.json();
    const icon = data.enabled ? '✅' : '❌';
    console.log(`\n${icon} [3] Webhook: enabled=${data.enabled}`);
    console.log(`   → URL: ${data.url}`);
    console.log(`   → Events: ${JSON.stringify(data.events)}`);
  } catch (e) {
    console.error(`\n❌ [3] Webhook: ${e.message}`);
  }

  // 4. Next.js
  try {
    const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : undefined;
    if (!appUrl) throw new Error("APP_URL não definida no .env");
    const res = await fetch(`${appUrl}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PING', data: {} }),
      signal: AbortSignal.timeout(3000)
    });
    console.log(`\n✅ [4] Next.js (APP_URL): RESPONDENDO → HTTP ${res.status}`);
  } catch (e) {
    console.error(`\n❌ [4] Next.js (APP_URL) NÃO ESTÁ RESPONDENDO: ${e.message}`);
  }

  // 5. Envio de mensagem direto
  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: API_KEY },
      body: JSON.stringify({
        number: '5538991046845',
        text: '🤖 Teste de diagnóstico AgendaAI'
      })
    });
    const data = await res.json();
    if (data.key) {
      console.log(`\n✅ [5] Envio de mensagem WhatsApp: OK → ID: ${data.key.id}`);
    } else {
      console.log(`\n❌ [5] Envio falhou: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.error(`\n❌ [5] Envio de mensagem: ${e.message}`);
  }

  console.log('\n======== FIM DO DIAGNÓSTICO ========');
  process.exit(0);
}

diagnose().catch(e => { console.error(e); process.exit(1); });
