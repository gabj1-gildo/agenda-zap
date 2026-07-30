import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';
import argon2 from 'argon2';

describe('Password Utilities', () => {
  it('deve fazer hash da senha com argon2id e os parâmetros corretos', async () => {
    const rawPassword = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(rawPassword);

    // O hash gerado por argon2 começa com $argon2id$v=19$m=19456,t=2,p=1
    expect(hash).toContain('$argon2id$');
    expect(hash).toContain('m=19456,t=2,p=1');
  });

  it('deve aceitar a senha correta no verifyPassword', async () => {
    const rawPassword = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('deve rejeitar uma senha errada no verifyPassword', async () => {
    const rawPassword = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(hash, 'SenhaErrada!');
    expect(isValid).toBe(false);
  });
});
