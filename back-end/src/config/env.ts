import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  // Ambiente e URLs
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  
  // Banco de Dados
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  
  // Autenticação
  JWT_SECRET: z.string().min(16).default('super-secret-jwt-key-minimum-16'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  ARGON2_SECRET: z.string().default('super-secret-argon2-key-minimum-32-chars-for-dev'),
  
  // Evolution API (WhatsApp)
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().min(1).optional(),
  EVOLUTION_INSTANCE_NAME: z.string().min(1).optional(),
  
  // Pagamentos
  MERCADOPAGO_API_URL: z.string().url().default('https://api.mercadopago.com'),
  MERCADOPAGO_CLIENT_ID: z.string().optional(),
  MERCADOPAGO_CLIENT_SECRET: z.string().optional(),
  MP_ACCESS_TOKEN: z.string().optional(), // Token da Plataforma para gerenciar assinaturas
  MP_SUCCESS_URL: z.string().optional(),
  MP_FAILURE_URL: z.string().optional(),
  MP_REDIRECT_URI: z.string().optional(),
  
  ASAAS_API_URL: z.string().url().default('https://api-sandbox.asaas.com/v3'), // Padrão sandbox
  ASAAS_API_KEY: z.string().optional(), // Token da API do Asaas (plataforma)

  ABACATEPAY_API_URL: z.string().url().default('https://api.abacatepay.com'),
  
  // IA
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gemini-2.5-flash-lite'),
  
  // Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  
  // E-mail e Cache
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Cron
  CRON_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
  throw new Error('Falha na validação das variáveis de ambiente.');
}

export const env = _env.data;
