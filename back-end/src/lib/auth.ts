import { env } from '@/config/env';
import jwt from 'jsonwebtoken';

const JWT_SECRET = env.JWT_SECRET;

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  tenants: { id: string; name: string }[];
  status: string;
}

export function verifyAuth(req: Request): AuthUser | null {
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  
  const authHeader = req.headers.get('authorization') || req.headers.get('x-authorization');
  console.log('[verifyAuth] authHeader:', authHeader ? 'present (length ' + authHeader.length + ')' : 'missing', 'queryToken:', !!queryToken);
  
  let token = queryToken;
  
  if (!token) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[verifyAuth] Invalid or missing authHeader and queryToken');
      return null;
    }
    token = authHeader.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    console.log('[verifyAuth] jwt.verify error:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão para acessar os dados do tenantId solicitado.
 * ADMIN tem acesso global. Usuários normais só acessam se pertencerem ao tenant.
 */
export function canAccessTenant(user: AuthUser, targetTenantId: string): boolean {
  if (user.role === 'SUPERADMIN') return true;
  return user.tenants.some(t => t.id === targetTenantId);
}
