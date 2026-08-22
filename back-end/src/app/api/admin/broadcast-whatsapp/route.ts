import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, tenants, systemSettings, userTenants } from '@/db/schema';
import { eq, isNotNull, isNull, inArray, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/services/whatsappService';

async function getFilteredPhoneNumbers(options: {
  target?: string;
  tenantIds?: string[];
  plans?: string[];
  paymentStatus?: string[];
  statusFilter?: string;
}) {
  const { target = 'ALL', tenantIds = [], plans = [], paymentStatus = [], statusFilter = 'ACTIVE' } = options;
  const phoneNumbers = new Set<string>();

  // 1. Obter empresas elegíveis conforme os filtros
  let tenantConditions = [];

  // Filtro de status da empresa (Ativa vs Lixeira/Excluída)
  if (statusFilter === 'ACTIVE') {
    tenantConditions.push(isNull(tenants.deletedAt));
  } else if (statusFilter === 'DELETED') {
    tenantConditions.push(isNotNull(tenants.deletedAt));
  }

  // Filtro de empresas específicas
  if (target === 'SPECIFIC_TENANTS' && tenantIds.length > 0) {
    tenantConditions.push(inArray(tenants.id, tenantIds));
  } else if (tenantIds.length > 0) {
    tenantConditions.push(inArray(tenants.id, tenantIds));
  }

  // Filtro por planos
  if (plans.length > 0) {
    tenantConditions.push(inArray(tenants.activePlan, plans));
  }

  // Filtro por situação de pagamento
  if (paymentStatus.length > 0) {
    tenantConditions.push(inArray(tenants.paymentStatus, paymentStatus));
  }

  const eligibleTenants = await db
    .select({ id: tenants.id, phone: tenants.phone })
    .from(tenants)
    .where(tenantConditions.length > 0 ? and(...tenantConditions) : undefined);

  const eligibleTenantIds = eligibleTenants.map(t => t.id);

  // 2. Se o alvo incluir empresas (TENANTS, ALL ou SPECIFIC_TENANTS)
  if (target === 'ALL' || target === 'TENANTS' || target === 'SPECIFIC_TENANTS') {
    eligibleTenants.forEach(t => {
      if (t.phone && t.phone.trim()) {
        phoneNumbers.add(t.phone.trim());
      }
    });
  }

  // 3. Se o alvo incluir usuários/funcionários (USERS ou ALL)
  if (target === 'ALL' || target === 'USERS') {
    if (eligibleTenantIds.length > 0) {
      // Buscar usuários vinculados às empresas elegíveis via userTenants
      const usersInTenants = await db
        .select({ userPhone: users.phone })
        .from(userTenants)
        .innerJoin(users, eq(userTenants.userId, users.id))
        .where(
          and(
            inArray(userTenants.tenantId, eligibleTenantIds),
            isNotNull(users.phone)
          )
        );

      usersInTenants.forEach(u => {
        if (u.userPhone && u.userPhone.trim()) {
          phoneNumbers.add(u.userPhone.trim());
        }
      });
    } else if (target === 'USERS' && tenantIds.length === 0 && plans.length === 0 && paymentStatus.length === 0) {
      // Sem filtro restritivo de empresas, traz todos os usuários com telefone
      const allUsers = await db.select({ phone: users.phone }).from(users).where(isNotNull(users.phone));
      allUsers.forEach(u => {
        if (u.phone && u.phone.trim()) phoneNumbers.add(u.phone.trim());
      });
    }
  }

  return Array.from(phoneNumbers);
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const {
      message,
      target,
      tenantIds,
      plans,
      paymentStatus,
      statusFilter,
      estimateOnly
    } = await req.json();

    const phoneList = await getFilteredPhoneNumbers({
      target,
      tenantIds,
      plans,
      paymentStatus,
      statusFilter
    });

    if (estimateOnly) {
      return NextResponse.json({
        success: true,
        count: phoneList.length,
        message: `${phoneList.length} destinatários selecionados com base nos filtros.`
      });
    }

    if (!message) {
      return NextResponse.json({ success: false, message: 'Mensagem vazia' }, { status: 400 });
    }

    if (phoneList.length === 0) {
      return NextResponse.json({ success: false, message: 'Nenhum destinatário encontrado com os filtros aplicados.' }, { status: 400 });
    }

    // Instância padrão do sistema
    const instanceSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_instance_name')
    });
    const instanceName = instanceSetting?.value || 'whatsapp-vendas';

    let successCount = 0;
    for (const phone of phoneList) {
      const sent = await sendWhatsAppMessage(phone, message, instanceName);
      if (sent) successCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Mensagem enviada com sucesso para ${successCount} de ${phoneList.length} destinatários.`
    });
  } catch (error) {
    console.error('Error broadcasting whatsapp message:', error);
    return NextResponse.json({ success: false, message: 'Erro interno ao realizar disparo' }, { status: 500 });
  }
}
