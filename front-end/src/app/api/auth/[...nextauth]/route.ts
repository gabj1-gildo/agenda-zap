import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from '@/config/env';

export async function refreshAccessToken(token: any) {
  try {
    const internalBackend = env.BACKEND_INTERNAL_URL;
    if (!internalBackend) throw new Error("BACKEND_INTERNAL_URL não definido.");
    const res = await fetch(`${internalBackend}/api/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ token: token.refreshToken }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    const refreshedTokens = await res.json();
    if (!res.ok || !refreshedTokens.success) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.data.token,
      refreshToken: refreshedTokens.data.refreshToken ?? token.refreshToken, // Fall back to old if not rotated
      accessTokenExpires: Date.now() + 15 * 60 * 1000,
    };
  } catch (error) {
    console.log('RefreshAccessTokenError', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  // @ts-expect-error - trustHost is used in some next-auth versions to bypass host checks
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const internalBackend = env.BACKEND_INTERNAL_URL;
          if (!internalBackend) throw new Error("BACKEND_INTERNAL_URL não definido.");
          const res = await fetch(`${internalBackend}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (res.ok && data.success && data.data?.user) {
            return {
              id: data.data.user.id,
              name: data.data.user.name ?? null,
              email: data.data.user.email,
              image: data.data.user.avatarUrl ?? null,
              role: data.data.user.role,
              tenants: data.data.user.tenants ?? [],
              status: data.data.user.status,
              mustResetPassword: data.data.user.mustResetPassword,
              accessToken: data.data.token,
              refreshToken: data.data.refreshToken,
            } as any;
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tenants = (user as any).tenants;
        token.tenantId = (user as any).tenants?.length > 0 ? (user as any).tenants[0].id : null;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.status = (user as any).status;
        token.mustResetPassword = (user as any).mustResetPassword;
        token.picture = (user as any).image;
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
        return token;
      }
      
      if (trigger === "update" && session) {
        if (session.tenantId !== undefined) token.tenantId = session.tenantId;
        if (session.picture !== undefined) token.picture = session.picture;
        if (session.name !== undefined) token.name = session.name;
      }
      
      // Return previous token if the access token has not expired yet (with a 30s margin)
      if (Date.now() < (token.accessTokenExpires as number) - 30 * 1000) {
        return token;
      }
      
      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenants = token.tenants;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).status = token.status;
        (session.user as any).mustResetPassword = token.mustResetPassword;
        (session.user as any).picture = token.picture;
        session.user.image = (token.picture as string) || null;
      }
      (session as any).tenantId = token.tenantId;
      (session as any).error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.refreshToken) {
        try {
          const internalBackend = env.BACKEND_INTERNAL_URL;
          if (!internalBackend) throw new Error("BACKEND_INTERNAL_URL não definido.");
          await fetch(`${internalBackend}/api/auth/logout`, {
            method: 'POST',
            body: JSON.stringify({ token: token.refreshToken }),
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) {
          console.error('Failed to revoke refresh token', e);
        }
      }
    }
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 dias
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
