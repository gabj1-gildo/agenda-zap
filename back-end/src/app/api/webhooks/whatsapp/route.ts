import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, chatSessions, tenants, tenantPhones } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import { getBase64FromMediaMessage } from '@/services/evolutionApi';
import { processIncomingMessage } from '@/services/chatProcessor';
import { redis } from '@/lib/redis';
import { env } from '@/config/env';

// Removido debounce in-memory para usar Redis (Serverless-safe)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (env.NODE_ENV === 'development') {
      require('fs').appendFileSync('webhook_dump.txt', JSON.stringify(body, null, 2) + '\n');
    }
    console.log(`[WEBHOOK RECEBIDO] Evento: ${body.event}, Instância: ${body.instance}`);

    // -----------------------------------------------------
    // TRATAR EVENTO DE CONEXÃO (EVITA O PROBLEMA DE DESCONECTADO NO FRONT)
    // -----------------------------------------------------
    if (body.event === 'connection.update') {
      const state = body.data?.state || body.data?.status;
      if (state && body.instance) {
        const upperState = state.toUpperCase();
        console.log(`[WEBHOOK] Atualização de conexão para ${body.instance}: ${upperState}`);
        
        const phoneRecord = await db.query.tenantPhones.findFirst({
          where: eq(tenantPhones.evolutionInstanceName, body.instance)
        });
        
        if (phoneRecord) {
          await db.update(tenantPhones)
            .set({ evolutionInstanceStatus: upperState, updatedAt: new Date() })
            .where(eq(tenantPhones.id, phoneRecord.id));
            
          if (upperState === 'OPEN') {
            await db.update(tenants)
              .set({ evolutionInstanceStatus: upperState, evolutionInstanceName: body.instance, updatedAt: new Date() })
              .where(eq(tenants.id, phoneRecord.tenantId));
          }
        }
      }
      return NextResponse.json({ success: true, message: 'Status de conexão atualizado' });
    }

    // Check if it's a valid Evolution API message event
    if (body.event !== 'messages.upsert' || !body.data || !body.data.message) {
      return NextResponse.json({ success: true, message: 'Ignored non-message event' });
    }

    const remoteJid = body.data.key.remoteJid;
    // Ignore group messages or status broadcasts
    if (!remoteJid || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
      return NextResponse.json({ success: true, message: 'Ignored group/status message' });
    }

    // Ignore messages sent by the bot itself or the phone owner
    if (body.data.key.fromMe) {
      return NextResponse.json({ success: true, message: 'Ignored message sent by me' });
    }

    let messageContent = body.data.message.conversation || body.data.message.extendedTextMessage?.text || "";
    let mediaBase64 = null;
    let mimeType = null;

    // Item 20: Media extraction
    if (body.data.message.imageMessage || body.data.message.audioMessage) {
       if (body.data.message.base64) {
           mediaBase64 = body.data.message.base64;
       } else {
           mediaBase64 = await getBase64FromMediaMessage(body.data.message, body.instance);
       }
       
       if (body.data.message.imageMessage) {
          mimeType = body.data.message.imageMessage.mimetype || 'image/jpeg';
          if (body.data.message.imageMessage.caption) {
             messageContent = body.data.message.imageMessage.caption;
          }
       } else if (body.data.message.audioMessage) {
          mimeType = body.data.message.audioMessage.mimetype || 'audio/ogg';
       }
    }

    if (!messageContent && !mediaBase64) {
      return NextResponse.json({ success: true, message: 'No text or media content found' });
    }

    const messageTimestamp = body.data.messageTimestamp;
    /*
    if (messageTimestamp) {
      const now = Math.floor(Date.now() / 1000);
      // Ignora mensagens com mais de 2 minutos (120 segundos)
      // REMOVIDO TEMPORARIAMENTE POIS O RELÓGIO DO APARELHO/EVOLUTION PODE ESTAR DESSINCRONIZADO
      if (now - messageTimestamp > 120) {
        console.log(`[WEBHOOK] Ignorando mensagem antiga de ${remoteJid}`);
        return NextResponse.json({ success: true, message: 'Ignored old message' });
      }
    }
    */

    const pushName = body.data.pushName || 'Cliente';

    // ==========================================
    // LÓGICA DE MESCLAGEM (DEBOUNCE DISTRIBUÍDO COM REDIS)
    // ==========================================
    const bufferKey = `whatsapp:buffer:${remoteJid}`;
    const timeKey = `whatsapp:time:${remoteJid}`;
    
    let redisSuccess = false;
    try {
      if (env.UPSTASH_REDIS_REST_URL) {
        // We stringify the object to buffer both text and media
        const payload = JSON.stringify({ messageContent, mediaBase64, mimeType });
        await redis.rpush(bufferKey, payload);
        await redis.set(timeKey, Date.now());
        // Configura expiração de segurança para não sujar o Redis caso algo falhe
        await redis.expire(bufferKey, 3600);
        await redis.expire(timeKey, 3600);
        redisSuccess = true;
      }
    } catch (e) {
      console.warn("Aviso: Redis falhou ao processar debounce. Entrando no modo de fallback direto.", e);
    }

    if (!redisSuccess) {
      // FALLBACK: processa imediatamente sem debounce
      console.log(`[WEBHOOK] Processando mensagem de ${remoteJid} sem debounce (Redis falhou ou não configurado).`);
      
      // O Next.js permite rodar código após a resposta usando waitUntil (para Vercel), mas no Render o event loop continua.
      // O ideal é não bloquear a resposta do webhook se possível, mas aqui aguardaremos para o fallback
      const phoneRecord = await db.query.tenantPhones.findFirst({ 
        where: eq(tenantPhones.evolutionInstanceName, body.instance),
        with: { tenant: true }
      });
      const tenant = phoneRecord?.tenant;
      if (tenant) {
        processIncomingMessage(remoteJid, pushName, messageContent, tenant, mediaBase64, mimeType).catch(console.error);
      }
      
      return NextResponse.json({ success: true, message: 'Message processing started directly (no debounce)' });
    }

    // Aguarda 10 segundos para ver se o usuário manda mais mensagens
    setTimeout(async () => {
      try {
        const lastTime = await redis.get(timeKey);
        const now = Date.now();
        
        // Se a última mensagem recebida foi há pelo menos 9.5 segundos, processamos.
        // Se foi menos, significa que outra mensagem chegou e o setTimeout dela vai assumir.
        if (lastTime && now - Number(lastTime) >= 9500) {
          // Lock simples para evitar condição de corrida caso 2 timeouts disparem juntos
          const lockKey = `whatsapp:lock:${remoteJid}`;
          const lock = await redis.set(lockKey, "locked", { nx: true, ex: 30 });
          
          if (lock) {
            try {
              // Pega todas as mensagens da fila e limpa
              const messagesArray = await redis.lrange(bufferKey, 0, -1);
              await redis.del(bufferKey);
              await redis.del(timeKey);
              
              if (messagesArray && messagesArray.length > 0) {
                let mergedText = [];
                let lastMedia = null;
                let lastMime = null;
                for (const item of messagesArray) {
                  try {
                    // Upstash Redis automatically parses JSON, so 'item' might already be an object
                    const parsed = typeof item === 'string' ? JSON.parse(item) : item;
                    
                    if (parsed && typeof parsed.messageContent === 'string') {
                      mergedText.push(parsed.messageContent);
                    }
                    if (parsed && parsed.mediaBase64) {
                      lastMedia = parsed.mediaBase64;
                      lastMime = parsed.mimeType;
                    }
                  } catch(e) {
                     // Backward compatibility for old raw text strings in Redis
                     mergedText.push(typeof item === 'string' ? item : JSON.stringify(item));
                  }
                }
                
                const phoneRecord = await db.query.tenantPhones.findFirst({ 
                  where: eq(tenantPhones.evolutionInstanceName, body.instance),
                  with: { tenant: true }
                });
                const tenant = phoneRecord?.tenant;
                if (tenant) {
                  await processIncomingMessage(remoteJid, pushName, mergedText.join('\n'), tenant, lastMedia, lastMime);
                }
              }
            } finally {
              // LIBERAR O LOCK SEMPRE para não travar a próxima mensagem do usuário
              await redis.del(lockKey);
            }
          }
        }
      } catch (err) {
        console.error("Erro no debounce do Redis:", err);
      }
    }, 10000); // 10 segundos de debounce

    // Retornamos 200 imediatamente para a Evolution API não dar timeout
    return NextResponse.json({ success: true, message: 'Message buffered in Redis. Timer started.' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

