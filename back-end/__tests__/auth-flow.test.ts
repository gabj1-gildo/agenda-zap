import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/db';
import { users, tenants } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { hashPassword } from '../src/lib/password';

// Importando os handlers diretamente para testar sem precisar subir o servidor HTTP
import { POST as LoginPOST } from '../src/app/api/auth/login/route';
import { POST as RefreshPOST } from '../src/app/api/auth/refresh/route';
import { POST as CreateUserPOST } from '../src/app/api/admin/users/route';
import { POST as ResetPasswordPOST } from '../src/app/api/auth/reset-password/route';

describe('Authentication Flow Integration Tests', () => {
  const tenantId = crypto.randomUUID();
  const superAdminId = crypto.randomUUID();
  const superAdminEmail = `super_${Date.now()}@test.com`;
  let saToken = '';
  
  beforeAll(async () => {
    // 1. Criar tenant
    await db.insert(tenants).values({ id: tenantId, name: 'Integration Test Tenant' });

    // 2. Criar superadmin para os testes
    const passwordHash = await hashPassword('admin123'); 
    await db.insert(users).values({
      id: superAdminId,
      name: 'SuperAdmin Test',
      email: superAdminEmail,
      passwordHash: passwordHash,
      role: 'SUPERADMIN',
      mustResetPassword: false
    });

    // 3. Fazer login do superadmin
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: superAdminEmail, password: 'admin123' }),
    });
    const res = await LoginPOST(req);
    const data = await res.json();
    saToken = data.data.token;
  });

  afterAll(async () => {
    // Limpeza opcional
  });

  describe('Fluxo: Detecção de reuso de Refresh Token', () => {
    it('deve rotacionar o token, revogar a cadeia no reuso, e negar o novo token', async () => {
      // 1. Logar novamente para obter um par de tokens fresco
      const loginReq = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: superAdminEmail, password: 'admin123' }),
      });
      const loginRes = await LoginPOST(loginReq);
      const loginData = await loginRes.json();
      const originalRefreshToken = loginData.data.refreshToken;

      expect(originalRefreshToken).toBeDefined();

      // 2. Rotacionar usando o refresh token válido
      const refreshReq1 = new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ token: originalRefreshToken }),
      });
      const refreshRes1 = await RefreshPOST(refreshReq1);
      const refreshData1 = await refreshRes1.json();
      
      expect(refreshData1.success).toBe(true);
      const newRefreshToken = refreshData1.data.refreshToken;

      // 3. Tentar reusar o token original (isso deve falhar e revogar a cadeia)
      const refreshReq2 = new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ token: originalRefreshToken }),
      });
      const refreshRes2 = await RefreshPOST(refreshReq2);
      const refreshData2 = await refreshRes2.json();

      expect(refreshData2.success).toBe(false);
      expect(refreshData2.message).toBe('Sessão revogada por motivo de segurança.');

      // 4. Tentar usar o NOVO token (agora a cadeia inteira deveria estar revogada)
      const refreshReq3 = new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ token: newRefreshToken }),
      });
      const refreshRes3 = await RefreshPOST(refreshReq3);
      const refreshData3 = await refreshRes3.json();

      expect(refreshData3.success).toBe(false);
      expect(refreshData3.message).toBe('Sessão revogada por motivo de segurança.');
    }, 30000);
  });

  describe('Fluxo: mustResetPassword e Reset de Senha', () => {
    const newEmail = `user_${Date.now()}@test.com`;
    let tempPassword = '';
    let loginToken = '';

    it('deve criar um usuário sem enviar senha, retornando mustResetPassword true', async () => {
      const createReq = new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${saToken}`,
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({ name: 'User Sem Senha', email: newEmail, role: 'USER', tenantIds: [tenantId] }),
      });
      const createRes = await CreateUserPOST(createReq);
      const createData = await createRes.json();

      expect(createData.success).toBe(true);
      expect(createData.data.mustResetPassword).toBe(true);
      
      // Como não temos acesso fácil ao mock de e-mail aqui sem interceptar o console, 
      // vamos definir uma senha conhecida no banco manualmente só para simular o recebimento da senha temporária pelo email
      tempPassword = 'temp_password_123';
      const hash = await hashPassword(tempPassword);
      await db.update(users).set({ passwordHash: hash }).where(eq(users.email, newEmail));
    }, 30000);

    it('deve logar com a senha temporária e constatar mustResetPassword no token', async () => {
      const loginReq = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, password: tempPassword }),
      });
      const loginRes = await LoginPOST(loginReq);
      const loginData = await loginRes.json();

      expect(loginData.success).toBe(true);
      expect(loginData.data.user.mustResetPassword).toBe(true);
      loginToken = loginData.data.token; // Para autorizar o reset
    }, 30000);

    it('deve permitir trocar a senha e remover o mustResetPassword', async () => {
      const newPassword = 'NovaSenhaSuperSegura1!';
      
      const resetReq = new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginToken}`,
        },
        body: JSON.stringify({ currentPassword: tempPassword, newPassword }),
      });
      
      const resetRes = await ResetPasswordPOST(resetReq);
      const resetData = await resetRes.json();

      expect(resetData.success).toBe(true);
      expect(resetData.message).toBe('Senha atualizada com sucesso.');

      // Verificar no banco
      const [dbUser] = await db.select().from(users).where(eq(users.email, newEmail)).limit(1);
      expect(dbUser.mustResetPassword).toBe(false);

      // Confirmar que consegue logar com a senha nova e não tem mais a flag
      const loginReq2 = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      const loginRes2 = await LoginPOST(loginReq2);
      const loginData2 = await loginRes2.json();

      expect(loginData2.success).toBe(true);
      expect(loginData2.data.user.mustResetPassword).toBe(false);
    }, 30000);
  });
});
