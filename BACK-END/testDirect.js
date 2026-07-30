// Simula exatamente o payload que a Evolution API envia
// para testar se o webhook do Next.js processa corretamente

require('dotenv').config();

async function testWebhookDirect() {
  const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : undefined;
  if (!appUrl) throw new Error("APP_URL nÃ£o estÃ¡ definida no .env");
  const url = `${appUrl}/api/webhooks/whatsapp`;

  // Payload exato que a Evolution API manda no evento messages.upsert
  const payload = {
    event: 'messages.upsert',
    instance: 'AgendaZap',
    data: {
      key: {
        remoteJid: '5538991046845@s.whatsapp.net',
        fromMe: false,
        id: 'FAKE_MSG_' + Date.now()
      },
      pushName: 'Teste Local',
      message: {
        conversation: 'Ola, quero agendar uma consulta'
      },
      messageType: 'conversation',
      messageTimestamp: Math.floor(Date.now() / 1000),
      instanceId: 'f63c53f7-251c-48a7-a7ce-c3dccd8768f4',
      source: 'web'
    },
    destination: url,
    date_time: new Date().toISOString(),
    server_url: process.env.EVOLUTION_API_URL?.replace(/\/$/, '') || 'https://url-falta.no-env',
    apikey: process.env.EVOLUTION_API_KEY || 'falta-key-no-env'
  };

  console.log(`Disparando POST para ${url}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`\nâœ… Resposta HTTP ${res.status}:`, text);
    
    if (res.ok) {
      console.log('\nâ³ Webhook recebido! Aguardando 17 segundos para o debounce disparar...');
      await new Promise(r => setTimeout(r, 17000));
      console.log('âœ… Tempo de debounce esgotado. Verifique se a mensagem chegou no WhatsApp e os logs do Next.js!');
    }
  } catch (e) {
    console.error('âŒ Erro ao chamar o webhook:', e.message);
    console.log('\nVerifique se o Next.js estÃ¡ rodando com: npm run dev');
  }
}

testWebhookDirect();
