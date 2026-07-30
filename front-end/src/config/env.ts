import { z } from 'zod';

// Configuração do client/server em Next.js
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
  BACKEND_INTERNAL_URL: z.string().optional(),
  NEXT_PUBLIC_EVOLUTION_URL: z.string().optional(),
});

const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL,
  NEXT_PUBLIC_EVOLUTION_URL: process.env.NEXT_PUBLIC_EVOLUTION_URL,
});

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas no front-end:', _env.error.format());
  throw new Error('Falha na validação das variáveis de ambiente do front-end.');
}

export const env = _env.data;
