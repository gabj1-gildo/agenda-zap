export type Role = 'SUPERADMIN' | 'ADMIN' | 'ATTENDANT';

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // Restrito SUPERADMIN
  '/admin': ['SUPERADMIN'],
  '/admin/tenants': ['SUPERADMIN'],
  '/admin/settings': ['SUPERADMIN'],
  '/admin/broadcast': ['SUPERADMIN'],
  '/admin/ai-presets': ['SUPERADMIN'],
  '/empresas': ['SUPERADMIN'],

  // Restrito SUPERADMIN e ADMIN
  '/admin/users': ['SUPERADMIN', 'ADMIN'],
  '/settings': ['SUPERADMIN', 'ADMIN'],
  '/team': ['SUPERADMIN', 'ADMIN'],
  '/reports': ['SUPERADMIN', 'ADMIN'],
  '/billing': ['SUPERADMIN', 'ADMIN'],
  '/planos': ['SUPERADMIN', 'ADMIN'],
  '/payments': ['SUPERADMIN', 'ADMIN'],
  '/services': ['SUPERADMIN', 'ADMIN'],

  // Aberto para todos os roles autenticados
  '/': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/agenda': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/appointments': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/broadcast': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/clients': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/funil': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/chats': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
  '/profile': ['SUPERADMIN', 'ADMIN', 'ATTENDANT'],
};

/**
 * Verifica se um usuário com determinada role e permissões tem acesso a uma rota.
 */
export function hasRouteAccess(path: string, role?: string, permissions?: string[]): boolean {
  if (!role) return false;

  // SUPERADMIN tem acesso irrestrito
  if (role === 'SUPERADMIN') return true;

  const routes = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);

  for (const route of routes) {
    if (path === route || path.startsWith(route + '/')) {
      const allowedRoles = ROUTE_PERMISSIONS[route];
      const roleAllowed = allowedRoles.includes(role as Role);

      if (!roleAllowed) return false;

      // Se for ATTENDANT, verificar as permissões granulares
      if (role === 'ATTENDANT') {
        const moduleMap: Record<string, string> = {
          '/agenda': 'agenda',
          '/appointments': 'agenda',
          '/clients': 'clients',
          '/chats': 'chats',
          '/funil': 'funil',
          '/payments': 'payments',
          '/broadcast': 'broadcast',
        };

        for (const [routePath, moduleName] of Object.entries(moduleMap)) {
          if (path === routePath || path.startsWith(routePath + '/')) {
            if (!permissions || !permissions.includes(moduleName)) {
              return false;
            }
          }
        }
      }

      return true;
    }
  }

  // Permite acesso se a rota não estiver mapeada
  return true;
}
