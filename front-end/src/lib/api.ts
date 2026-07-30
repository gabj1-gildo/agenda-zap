/**
 * Returns the correct backend API URL for fetches.
 * 
 * - Server-side (SSR/Server Components): goes directly to http://localhost:3001
 * - Client-side (browser): uses the /api/backend proxy via window.location.origin
 *   so it works on any host (localhost, ngrok, production domain).
 */
import { env } from '@/config/env';

export function getBackendUrl(path: string = ''): string {
  // Server-side: always go directly to backend
  if (typeof window === 'undefined') {
    const internalBackend = env.BACKEND_INTERNAL_URL;
    if (!internalBackend) throw new Error("BACKEND_INTERNAL_URL não definido.");
    return `${internalBackend}${path}`;
  }
  
  // Client-side: use the BFF proxy always
  return `/api/backend${path}`;
}
