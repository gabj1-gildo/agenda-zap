import { env } from '@/config/env';

export async function sendWhatsAppMessage(remoteJid: string, text: string, customInstanceName?: string) {
  const url = env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apikey = env.EVOLUTION_API_KEY;
  const instance = customInstanceName || env.EVOLUTION_INSTANCE_NAME;

  if (!url || !apikey || !instance) {
    console.error('Evolution API credentials missing.');
    return false;
  }

  const endpoint = `${url}/message/sendText/${instance}`;

  try {
    let cleanNumber = remoteJid.split('@')[0].replace(/\D/g, '');
    if (!cleanNumber.startsWith('55') && cleanNumber.length >= 10 && cleanNumber.length <= 11) {
      cleanNumber = '55' + cleanNumber;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: text
      })
    });

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

export async function fetchWhatsAppHistory(remoteJid: string, limit: number = 50, customInstanceName?: string) {
  const url = env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apikey = env.EVOLUTION_API_KEY;
  const instance = customInstanceName || env.EVOLUTION_INSTANCE_NAME;

  if (!url || !apikey || !instance) {
    console.error('Evolution API credentials missing.');
    return [];
  }

  const endpoint = `${url}/chat/findMessages/${instance}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify({
        where: {
          key: { remoteJid: remoteJid } // Dependendo da versao pode ser apenas { remoteJid } ou { key: { remoteJid } }
        }
      })
    });

    if (!response.ok) {
      // Se der erro por usar key.remoteJid, tentamos apenas remoteJid fallback
      const fallbackResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': apikey },
        body: JSON.stringify({ where: { remoteJid: remoteJid } })
      });
      if (!fallbackResponse.ok) {
        console.error('Failed to fetch WhatsApp history:', await fallbackResponse.text());
        return [];
      }
      const data = await fallbackResponse.json();
      return parseEvolutionMessages(data, limit);
    }

    const data = await response.json();
    return parseEvolutionMessages(data, limit);
  } catch (error) {
    console.error('Error fetching WhatsApp history:', error);
    return [];
  }
}

function parseEvolutionMessages(data: any, limit: number) {
  let messagesArray = [];
  
  if (Array.isArray(data)) {
    messagesArray = data;
  } else if (data.messages && Array.isArray(data.messages)) {
    messagesArray = data.messages;
  } else if (data.messages && data.messages.records && Array.isArray(data.messages.records)) {
    messagesArray = data.messages.records;
  } else if (data.records && Array.isArray(data.records)) {
    messagesArray = data.records;
  } else if (data.data && Array.isArray(data.data)) {
    messagesArray = data.data;
  }
  
  const formattedHistory = messagesArray
    .filter((msg: any) => msg.message && (msg.message.conversation || msg.message.extendedTextMessage?.text))
    .sort((a: any, b: any) => {
       const tsA = a.messageTimestamp || 0;
       const tsB = b.messageTimestamp || 0;
       return tsA - tsB;
    })
    .slice(-limit)
    .map((msg: any) => {
      const isFromMe = msg.key?.fromMe || false;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      return {
        role: isFromMe ? "system" : "user",
        content: text
      };
    });

  return formattedHistory;
}

export async function sendWhatsAppImage(remoteJid: string, imageUrl: string, caption: string = "", customInstanceName?: string) {
  const url = env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apikey = env.EVOLUTION_API_KEY;
  const instance = customInstanceName || env.EVOLUTION_INSTANCE_NAME;

  if (!url || !apikey || !instance) return false;

  const endpoint = `${url}/message/sendMedia/${instance}`;

  try {
    let cleanNumber = remoteJid.split('@')[0].replace(/\D/g, '');
    if (!cleanNumber.startsWith('55') && cleanNumber.length >= 10 && cleanNumber.length <= 11) {
      cleanNumber = '55' + cleanNumber;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        options: { delay: 1200, presence: 'composing' },
        mediatype: "image",
        media: imageUrl,
        caption: caption
      })
    });

    if (!response.ok) {
      console.error('Failed to send WhatsApp image:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp image:', error);
    return false;
  }
}

export async function getBase64FromMediaMessage(messageObj: any, customInstanceName?: string): Promise<string | null> {
  const url = env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apikey = env.EVOLUTION_API_KEY;
  const instance = customInstanceName || env.EVOLUTION_INSTANCE_NAME;

  if (!url || !apikey || !instance) return null;

  const endpoint = `${url}/chat/getBase64FromMediaMessage/${instance}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify({ message: messageObj })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.base64 || null;
  } catch (err) {
    console.error('Error fetching base64 from media:', err);
    return null;
  }
}

