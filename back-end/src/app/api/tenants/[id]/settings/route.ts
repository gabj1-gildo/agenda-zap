import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentKeys, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

// Retorna as configurações do Tenant (Pagamentos, Calendário)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

    if (!tenant) return NextResponse.json({ success: false, message: 'Tenant não encontrado' }, { status: 404 });

    const keys = await db.select().from(paymentKeys).where(eq(paymentKeys.tenantId, tenantId));
    
    return NextResponse.json({
      success: true,
      data: {
        paymentKeys: keys.map(k => ({ id: k.id, gateway: k.gateway, isActive: k.isActive, name: k.name })), // omitimos o token por segurança
        googleCalendarTokenExists: !!tenant.googleCalendarToken
      }
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, message: 'Erro ao buscar settings' }, { status: 500 });
  }
}

// Atualiza ou insere chaves de pagamento
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { gateway, token, name } = await req.json();


    if (!gateway || !token || !name) {
      return NextResponse.json({ success: false, message: 'Dados incompletos' }, { status: 400 });
    }

    // Desativa as outras chaves se estamos criando/ativando uma nova
    await db.update(paymentKeys)
      .set({ isActive: false })
      .where(eq(paymentKeys.tenantId, tenantId));

    // Insere a nova chave como ativa
    const [newKey] = await db.insert(paymentKeys).values({
      tenantId,
      gateway,
      token,
      name,
      isActive: true
    }).returning();

    return NextResponse.json({ success: true, data: newKey });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ success: false, message: 'Erro ao salvar chave de pagamento' }, { status: 500 });
  }
}
