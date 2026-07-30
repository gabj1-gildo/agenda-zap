import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function handleListServices(tenant: any): Promise<any> {
  const activeServices = await db.select().from(services)
    .where(and(
      eq(services.tenantId, tenant.id),
      eq(services.isActive, true)
    ));

  if (activeServices.length === 0) {
    return { result: "Nenhum serviço ativo encontrado para este estabelecimento." };
  }

  const resultList = activeServices.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.durationMinutes
  }));

  return { result: resultList };
}
