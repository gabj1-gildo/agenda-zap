import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasRouteAccess } from "@/lib/routePermissions";

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const path = url.pathname;

  // 1. Roteamento de Subdomínio e Redirecionamento da Raiz
  if (path === "/") {
    if (hostname.startsWith("planos.")) {
      return NextResponse.rewrite(new URL("/planos", req.url));
    }
    // Domínio principal -> redireciona para login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Proteção de Rotas com NextAuth
  const authMiddleware = withAuth(
    function onSuccess(req) {
      const token = req.nextauth.token;
      const role = (token?.role as string) || '';
      const isResetPasswordRoute = path === '/reset-password';

      if (token?.mustResetPassword && !isResetPasswordRoute) {
        return NextResponse.redirect(new URL('/reset-password', req.url));
      }
      if (!token?.mustResetPassword && isResetPasswordRoute) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      let permissions: string[] = [];
      if (token?.tenants && token.tenantId) {
        const activeTenant = (token.tenants as any[]).find(t => t.id === token.tenantId);
        if (activeTenant && activeTenant.permissions) {
          permissions = activeTenant.permissions;
        }
      }

      if (!hasRouteAccess(path, role, permissions)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      return NextResponse.next();
    },
    {
      callbacks: {
        authorized: ({ token }) => !!token,
      },
      pages: {
        signIn: "/login",
      },
    }
  );

  return (authMiddleware as any)(req, undefined);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - api/backend (backend proxy)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - forgot-password
     * - planos (landing page path)
     */
    "/((?!api/auth|api/backend|_next/static|_next/image|favicon.ico|login|forgot-password|planos).*)",
  ],
};
