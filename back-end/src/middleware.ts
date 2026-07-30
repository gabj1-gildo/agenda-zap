import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Inicializar Redis e Rate Limit apenas se as variáveis estiverem presentes
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  });
}

async function sha256(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
  // Ignorar rotas que não são da API
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1. JWT Blacklist Check
  if (redis) {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-authorization');
    const queryToken = request.nextUrl.searchParams.get('token');
    
    let token = queryToken;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      try {
        const tokenHash = await sha256(token);
        const isBlacklisted = await redis.get(`bl_${tokenHash}`);
        if (isBlacklisted) {
          return NextResponse.json(
            { success: false, message: 'Token revogado (Sessão expirada)' },
            { status: 401 }
          );
        }
      } catch (err) {
        console.error('Error checking blacklist in middleware', err);
      }
    }
  }

  // 2. Rate Limiting
  if (ratelimit) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    try {
      const { success, pending, limit, reset, remaining } = await ratelimit.limit(
        `ratelimit_${ip}`
      );
      
      if (!success) {
        return NextResponse.json(
          { success: false, message: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString()
            }
          }
        );
      }
    } catch (err) {
      console.error('Rate limit error', err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
