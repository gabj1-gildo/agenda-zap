const fs = require('fs');

async function refreshQR() {
  console.log('[1] Gerando novo QR Code para instância AgendaZap...');
  const res = await fetch('http://localhost:8080/instance/connect/AgendaZap', {
    headers: { apikey: 'evolution_secret_key' }
  });
  const d = await res.json();

  if (d.base64) {
    const html = `<html><body style="font-family:sans-serif;padding:30px">
      <h2>QR Code - Robo AgendaZap</h2>
      <p>Abra o WhatsApp no celular <b>38991046845</b>, va em <b>Dispositivos Vinculados</b> e escaneie este codigo:</p>
      <img style="border:1px solid #ccc;max-width:400px" src="${d.base64}" />
      <p style="color:gray;font-size:12px">Gerado em: ${new Date().toLocaleString()}</p>
    </body></html>`;
    fs.writeFileSync('qrcode.html', html);
    console.log('✅ QR Code atualizado! Abra BACK-END/qrcode.html no navegador e escaneie com o WhatsApp do robo.');
  } else if (d.instance && d.instance.state === 'open') {
    console.log('✅ Instância já está conectada! Estado: open - Pode testar o envio!');
  } else {
    console.log('Resposta inesperada:', JSON.stringify(d, null, 2));
  }
}

refreshQR().catch(console.error);
