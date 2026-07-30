require('dotenv').config();
const { spawn } = require('child_process');

console.log('Iniciando o Next.js para testes...');
const nextProcess = spawn('npm', ['run', 'dev', '--', '-p', '3005'], { cwd: __dirname, shell: true });

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Next.js] ${output.trim()}`);
  
  if (output.includes('Ready in') || output.includes('ready started server')) {
    console.log('\n✅ Servidor pronto. Iniciando disparo das mensagens fracionadas...\n');
    dispararMensagens();
  }
});

nextProcess.stderr.on('data', (data) => {
  console.error(`[Next.js Error] ${data.toString()}`);
});

const payloadBase = {
  event: 'messages.upsert',
  data: {
    key: { remoteJid: '5511999999999@s.whatsapp.net' },
    pushName: 'João Silva',
    message: { conversation: '' }
  }
};

async function dispararMensagens() {
  const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : undefined;
  if (!appUrl) throw new Error("APP_URL não está definida no .env");
  const url = `${appUrl}/api/webhooks/whatsapp`;
  
  // Mensagem 1
  const payload1 = JSON.parse(JSON.stringify(payloadBase));
  payload1.data.message.conversation = 'Oi';
  console.log('Enviando Mensagem 1: "Oi"');
  await fetch(url, { method: 'POST', body: JSON.stringify(payload1) });

  // Espera 2 segundos
  await new Promise(r => setTimeout(r, 2000));
  
  // Mensagem 2
  const payload2 = JSON.parse(JSON.stringify(payloadBase));
  payload2.data.message.conversation = 'Gostaria de agendar um horário';
  console.log('Enviando Mensagem 2: "Gostaria de agendar um horário"');
  await fetch(url, { method: 'POST', body: JSON.stringify(payload2) });

  // Espera 3 segundos
  await new Promise(r => setTimeout(r, 3000));
  
  // Mensagem 3
  const payload3 = JSON.parse(JSON.stringify(payloadBase));
  payload3.data.message.conversation = 'Para amanhã às 14h';
  console.log('Enviando Mensagem 3: "Para amanhã às 14h"');
  await fetch(url, { method: 'POST', body: JSON.stringify(payload3) });

  console.log('\n⏳ Todas as mensagens enviadas. Agora aguardaremos 15 segundos para o debounce mesclar e o processamento iniciar...\n');
  
  setTimeout(() => {
    console.log('Testes finalizados! Encerrando o Next.js...');
    nextProcess.kill();
    process.exit(0);
  }, 20000); // 20 segundos
}
