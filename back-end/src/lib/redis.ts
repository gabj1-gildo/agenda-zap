import { env } from '@/config/env';
import { Redis } from '@upstash/redis';

// Inicializa o cliente Redis
// Certifique-se de configurar UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN no .env
export const redis = env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : ({
      get: async () => null,
      set: async () => 'OK',
    } as unknown as Redis);
