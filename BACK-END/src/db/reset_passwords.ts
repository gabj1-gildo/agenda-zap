import { db } from './index';
import { users } from './schema';
import { hashPassword, generateTemporaryPassword } from '../lib/password';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔄 Iniciando processo de reset de senhas...');
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.log('Nenhum usuário encontrado.');
    process.exit(0);
  }

  console.log(`Encontrados ${allUsers.length} usuários. Gerando senhas temporárias...`);
  
  for (const user of allUsers) {
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(tempPassword);
    
    await db.update(users)
      .set({
        passwordHash: hashedPassword,
        mustResetPassword: true,
      })
      .where(eq(users.id, user.id));
      
    console.log(`✅ Usuário: ${user.email} | Nova senha temporária: ${tempPassword}`);
  }
  
  console.log('✅ Todas as senhas foram resetadas com sucesso!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erro ao resetar senhas:', err);
  process.exit(1);
});
