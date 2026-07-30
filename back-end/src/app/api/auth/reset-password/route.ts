import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { verifyPassword, hashPassword, validatePassword } from '@/lib/password';

export async function POST(req: Request) {
  try {
    // Para resetar a senha, o usuário deve estar logado (com a senha temporária atual)
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Senhas não fornecidas.' }, { status: 400 });
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
    }

    // Buscar o usuário real no banco
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!dbUser) {
      return NextResponse.json({ success: false, message: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Validar a senha atual (temporária)
    const isValid = await verifyPassword(dbUser.passwordHash, currentPassword);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Senha atual incorreta.' }, { status: 400 });
    }

    // Gerar o hash da nova senha
    const newPasswordHash = await hashPassword(newPassword);

    // Atualizar no banco e remover a flag mustResetPassword
    await db.update(users)
      .set({ 
        passwordHash: newPasswordHash,
        mustResetPassword: false 
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
