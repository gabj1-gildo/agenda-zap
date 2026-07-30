import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Executa um callback dentro de uma transacao PostgreSQL com o tenant_id
 * configurado como variavel de sessao. Isso permite que as politicas RLS
 * filtrem automaticamente os dados pelo tenant correto.
 */
export async function withTenant<T>(
  tenantId: string,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Força RLS mesmo para superusers
    await tx.execute(sql`SET LOCAL row_security = on`);
    
    // Define o tenant_id como variavel local da transacao
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
    );
    return callback(tx as unknown as typeof db);
  });
}

/**
 * Versao para uso com service role (sem RLS) - apenas para
 * operacoes administrativas internas (ex: SuperAdmin, webhooks do sistema).
 */
export { db as dbAdmin };
