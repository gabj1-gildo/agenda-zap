import { NextResponse } from 'next/server';

export async function GET() {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'AgendaZap - API Externa & Webhooks',
      version: '1.0.0',
      description: 'Documentação dos Webhooks e endpoints de integração externa para lojistas.'
    },
    servers: [
      {
        url: 'https://agenda-zap.example.com',
        description: 'Servidor Principal'
      }
    ],
    paths: {
      '/api/webhooks/whatsapp': {
        post: {
          summary: 'Recebe mensagens via Evolution API',
          description: 'Endpoint configurado na Evolution API para envio e recebimento de mensagens do WhatsApp.',
          responses: {
            '200': { description: 'Webhook processado ou buffeirizado.' }
          }
        }
      },
      '/api/webhooks/whatsapp-meta': {
        post: {
          summary: 'Recebe mensagens via Meta Cloud API',
          description: 'Endpoint configurado no Facebook Developer Portal para receber eventos webhook oficiais.',
          responses: {
            '200': { description: 'Webhook oficial processado.' }
          }
        }
      },
      '/api/webhooks/payment': {
        post: {
          summary: 'Recebe notificações de gateways de pagamento',
          description: 'Processa pagamentos Asaas, Mercado Pago e AbacatePay, atualizando status de agendamentos.',
          responses: {
            '200': { description: 'Pagamento atualizado com sucesso.' }
          }
        }
      }
    },
    components: {
      schemas: {
        WebhookOutboundEvent: {
          type: 'object',
          properties: {
            event: { type: 'string', example: 'APPOINTMENT_CREATED' },
            timestamp: { type: 'string', format: 'date-time' },
            data: { type: 'object', description: 'Dados relativos ao evento disparado.' }
          }
        }
      }
    }
  };

  return NextResponse.json(swaggerSpec);
}
