
require('dotenv').config();

async function testSend() {
  // Pegue o seu próprio número ou o número do cliente (coloque no formato DDI+DDD+NUMERO)
  // Como é só um teste local para ver se a Evolution envia, vamos colocar um número aleatório ou pedir pro usuário colocar o dele.
  // Vou apenas listar as instâncias para ver se a AgendaZap tá conectada de fato.
  const url = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apikey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  console.log(`URL: ${url}`);
  console.log(`API_KEY: ${apikey}`);
  console.log(`INSTANCE: ${instance}`);

  console.log('\n--- Verificando status da instância ---');
  const statusRes = await fetch(`${url}/instance/connectionState/${instance}`, {
    headers: { apikey }
  });
  const statusText = await statusRes.text();
  console.log('Status Response:', statusText);

  console.log('\n--- Tentando enviar mensagem de teste ---');
  const sendRes = await fetch(`${url}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey },
    body: JSON.stringify({
      number: '5538991046845',
      text: 'Teste de envio pelo script'
    })
  });
  console.log('Send Response:', await sendRes.text());
}

testSend();
