import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { hasRouteAccess } from "@/lib/routePermissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = (token?.role as string) || '';
    const isResetPasswordRoute = path === '/reset-password';

    // Must reset password check
    if (token?.mustResetPassword && !isResetPasswordRoute) {
      return NextResponse.redirect(new URL('/reset-password', req.url));
    }
    if (!token?.mustResetPassword && isResetPasswordRoute) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Obter permissões do tenant ativo
    let permissions: string[] = [];
    if (token?.tenants && token.tenantId) {
      const activeTenant = (token.tenants as any[]).find(t => t.id === token.tenantId);
      if (activeTenant && activeTenant.permissions) {
        permissions = activeTenant.permissions;
      }
    }

    // Role-Based Access Control
    if (!hasRouteAccess(path, role, permissions)) {
      return NextResponse.redirect(new URL('/', req.url));
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - api/backend (backend proxy - handled by next.config rewrites)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - forgot-password
     */
    "/((?!api/auth|api/backend|_next/static|_next/image|favicon.ico|login|forgot-password).*)",
  ],
};
