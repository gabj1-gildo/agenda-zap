import argon2 from 'argon2';
import crypto from 'crypto';
import { env } from '../config/env';

const argon2Config = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  secret: Buffer.from(env.ARGON2_SECRET),
};

export async function hashPassword(plain: string): Promise<string> {
  return await argon2.hash(plain, argon2Config);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    if (await argon2.verify(hash, plain, { secret: argon2Config.secret })) return true;
  } catch (e) {}

  try {
    if (await argon2.verify(hash, plain)) return true;
  } catch (e) {}

  return false;
}

export async function verifyPin(dbPin: string | null, inputPin: string): Promise<boolean> {
  if (!dbPin) return false;
  if (dbPin.startsWith('$argon2')) {
    return await verifyPassword(dbPin, inputPin);
  }
  // Legacy text PIN fallback
  return dbPin === inputPin;
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'A senha deve ter no mínimo 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um número.' };
  }
  if (!/[^a-zA-Z\d]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um caractere especial (!@#$%, etc).' };
  }
  return { isValid: true };
}

export function generateTemporaryPassword(): string {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '@$!%*?&';
  
  // Garantir pelo menos um de cada
  let tempPassword = '';
  tempPassword += upperCase[crypto.randomInt(0, upperCase.length)];
  tempPassword += lowerCase[crypto.randomInt(0, lowerCase.length)];
  tempPassword += numbers[crypto.randomInt(0, numbers.length)];
  tempPassword += specialChars[crypto.randomInt(0, specialChars.length)];
  
  // Preencher o restante (4 caracteres) de forma aleatória com todos os caracteres possíveis
  const allChars = upperCase + lowerCase + numbers + specialChars;
  for (let i = 0; i < 4; i++) {
    tempPassword += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Embaralhar a senha resultante para não ser previsível
  return tempPassword.split('').sort(() => 0.5 - Math.random()).join('');
}
