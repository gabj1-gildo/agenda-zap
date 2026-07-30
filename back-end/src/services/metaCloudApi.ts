export async function sendMetaWhatsAppMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  text: string
): Promise<any> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  // Format to standard WhatsApp format without '+' and '@s.whatsapp.net'
  const cleanTo = to.replace('@s.whatsapp.net', '').replace('+', '');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Meta API Error: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendMetaWhatsAppImage(
  phoneNumberId: string,
  token: string,
  to: string,
  mediaUrl: string,
  caption?: string
): Promise<any> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const cleanTo = to.replace('@s.whatsapp.net', '').replace('+', '');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'image',
      image: {
        link: mediaUrl,
        caption: caption || ''
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Meta API Error: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function downloadMetaMediaBase64(mediaId: string, token: string): Promise<{ base64: string, mimeType: string } | null> {
  try {
    // 1. Obter URL do arquivo
    const metaUrlResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!metaUrlResponse.ok) return null;
    
    const metaData = await metaUrlResponse.json();
    if (!metaData.url) return null;
    
    const mimeType = metaData.mime_type || 'application/octet-stream';

    // 2. Fazer download do binário
    const mediaRes = await fetch(metaData.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!mediaRes.ok) return null;
    
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    return { base64, mimeType };
  } catch (err) {
    console.error('Error downloading Meta media:', err);
    return null;
  }
}
