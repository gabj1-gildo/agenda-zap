require('dotenv').config();
const fs = require('fs');
const path = require('path');

const EVOLUTION_URL = process.env.EVOLUTION_API_URL ? process.env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;

if (!EVOLUTION_URL || !API_KEY || !INSTANCE_NAME) {
  throw new Error("❌ Variáveis de ambiente da Evolution API faltando no .env (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME)");
}

// A URL que a Evolution API vai chamar. 
// O Back-end roda na porta 3001. Mas como a Evolution está externa, precisamos de um túnel (Ngrok/Localtunnel) ou URL pública.
const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : undefined;
if (!appUrl) {
  throw new Error("❌ Variável de ambiente APP_URL faltando no .env (Necessário para a Evolution apontar o Webhook para cá)");
}
const WEBHOOK_URL = `${appUrl}/api/webhooks/whatsapp`;

async function setup() {
  try {
    console.log(`[1] Verificando se a instância ${INSTANCE_NAME} já existe...`);
    
    // 1. Tenta buscar a instância
    const fetchRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: API_KEY }
    });
    const instances = await fetchRes.json();
    const exists = Array.isArray(instances) && instances.some(i => {
      if (i.instance && i.instance.instanceName === INSTANCE_NAME) return true;
      if (i.instanceName === INSTANCE_NAME) return true;
      if (i.name === INSTANCE_NAME) return true;
      return false;
    });

    let qrCodeBase64 = null;

    if (!exists) {
      console.log(`[2] Criando a instância ${INSTANCE_NAME}...`);
      const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: API_KEY },
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      
      const createData = await createRes.json();
      if (createData.qrcode && createData.qrcode.base64) {
        qrCodeBase64 = createData.qrcode.base64;
      }
    } else {
      console.log(`[2] A instância ${INSTANCE_NAME} já existe. Tentando pegar o QR Code caso não esteja logada...`);
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { apikey: API_KEY }
      });
      const connectData = await connectRes.json();
      if (connectData.base64) {
        qrCodeBase64 = connectData.base64;
      }
    }

    if (qrCodeBase64) {
      // Salva o QRCode como um arquivo HTML para você abrir no navegador e ler
      const html = `<html><body><h2>Leia o QR Code com o seu WhatsApp</h2><img src="${qrCodeBase64}" /></body></html>`;
      fs.writeFileSync(path.join(__dirname, 'qrcode.html'), html);
      console.log(`\n✅ ATENÇÃO: QR Code gerado! Abra o arquivo BACK-END/qrcode.html no seu navegador e escaneie com o celular que será o "Robô".\n`);
    } else {
      console.log(`\n✅ Instância já parece estar conectada ao WhatsApp!\n`);
    }

    console.log(`[3] Configurando Webhook para apontar para o nosso Next.js...`);
    const webhookRes = await fetch(`${EVOLUTION_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: API_KEY },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ["MESSAGES_UPSERT"]
        }
      })
    });
    
    if (webhookRes.ok) {
      console.log(`✅ Webhook configurado com sucesso para: ${WEBHOOK_URL}`);
    } else {
      console.error(`❌ Erro ao configurar Webhook:`, await webhookRes.text());
    }

    console.log(`\n[4] Configuração finalizada. A instância configurada foi: ${INSTANCE_NAME}`);

  } catch (err) {
    console.error('Erro geral no setup:', err.message);
  }
}

setup();
