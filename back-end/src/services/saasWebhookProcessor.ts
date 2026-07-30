import { db } from '@/db';
import { users, tenants, userTenants, userSubscriptions, plans, systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateTemporaryPassword } from '@/lib/password';
import { sendEmail } from '@/services/emailService';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export async function processSaasPayment(externalReference: string, gateway: 'ASAAS' | 'MERCADOPAGO', paymentId: string, customerId?: string, subscriptionId?: string) {
  try {
    if (!externalReference) return { success: false, reason: 'Sem externalReference' };
    
    let payload;
    try {
      payload = JSON.parse(externalReference);
    } catch {
      return { success: false, reason: 'externalReference inválido' };
    }

    const { e: email, n: name, d: document, p: phone, pl: planId } = payload;
    if (!email || !planId) return { success: false, reason: 'Faltam dados no payload' };

    // Verifica Idempotência / Verifica se usuário existe
    let user = await db.query.users.findFirst({ where: eq(users.email, email) });
    let isNewUser = false;
    let plainPassword = '';

    if (!user) {
      isNewUser = true;
      plainPassword = generateTemporaryPassword();
      const passwordHash = await hashPassword(plainPassword);
      
      const [newUser] = await db.insert(users).values({
        email,
        name,
        passwordHash,
        role: 'TENANT',
        status: 'ACTIVE',
        phone,
        cpf: document,
        mustResetPassword: true
      }).returning();
      
      user = newUser;

      // Cria a Tenant
      const [newTenant] = await db.insert(tenants).values({
        name: name,
        email,
        phone,
        document,
        activePlan: 'SAAS_ACTIVE',
        paymentStatus: 'ACTIVE'
      }).returning();

      // Vincula
      await db.insert(userTenants).values({
        userId: user.id,
        tenantId: newTenant.id,
        role: 'ADMIN'
      });
    }

    // Busca plano
    const plan = await db.query.plans.findFirst({ where: eq(plans.id, planId) });
    if (!plan) return { success: false, reason: 'Plano não encontrado' };

    // Define validade baseada no intervalo
    const validUntil = new Date();
    if (plan.interval === 'monthly') {
      validUntil.setMonth(validUntil.getMonth() + 1);
    } else if (plan.interval === 'semiannual') {
      validUntil.setMonth(validUntil.getMonth() + 6);
    } else if (plan.interval === 'yearly') {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1);
    }

    // Cria/Atualiza a Assinatura do usuário
    // Se ele já tiver, atualizamos a validade. Para simplificar, vamos inserir uma nova ou atualizar a existente.
    const existingSub = await db.query.userSubscriptions.findFirst({ where: eq(userSubscriptions.userId, user.id) });
    
    if (existingSub) {
      await db.update(userSubscriptions).set({
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodEnd: validUntil,
        asaasCustomerId: customerId || existingSub.asaasCustomerId,
        asaasSubscriptionId: subscriptionId || existingSub.asaasSubscriptionId,
        mpSubscriptionId: gateway === 'MERCADOPAGO' ? paymentId : existingSub.mpSubscriptionId
      }).where(eq(userSubscriptions.id, existingSub.id));
    } else {
      await db.insert(userSubscriptions).values({
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodEnd: validUntil,
        asaasCustomerId: customerId,
        asaasSubscriptionId: subscriptionId,
        mpSubscriptionId: gateway === 'MERCADOPAGO' ? paymentId : null
      });
    }

    // Atualiza status do tenant (se já existia e estava bloqueado)
    if (!isNewUser) {
      const userT = await db.query.userTenants.findFirst({ where: eq(userTenants.userId, user.id) });
      if (userT) {
        await db.update(tenants).set({ paymentStatus: 'ACTIVE', activePlan: 'SAAS_ACTIVE' }).where(eq(tenants.id, userT.tenantId));
      }
    }

    // Envia Comunicação apenas se for usuário novo (para dar as boas-vindas com senha)
    // Se não, poderia ser um email de "Renovação confirmada", mas o provedor (Asaas/MP) já manda recibo.
    if (isNewUser) {
      const loginUrl = process.env.FRONTEND_URL + '/login';
      const msgText = `Olá *${name}*, seja bem-vindo ao Agenda Zap! 🎉\n\nSeu pagamento foi aprovado e sua conta já está liberada.\n\nAcesse: ${loginUrl}\nLogin: ${email}\nSenha provisória: *${plainPassword}*\n\nVocê poderá alterar a senha no primeiro acesso.\n\nBoas vendas!`;

      // Whatsapp
      const instanceSetting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'whatsapp_default_instance_name')
      });
      if (instanceSetting && instanceSetting.value) {
        await sendWhatsAppMessage(phone + '@s.whatsapp.net', msgText, instanceSetting.value).catch(e => console.error('Erro WPP Webhook', e));
      }

      // E-mail
      const emailHtml = `
        <h1>Bem-vindo(a) ao Agenda Zap!</h1>
        <p>Olá <b>${name}</b>,</p>
        <p>Sua conta foi criada e o pagamento confirmado com sucesso.</p>
        <p><b>Acesso:</b> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><b>Login:</b> ${email}</p>
        <p><b>Senha provisória:</b> ${plainPassword}</p>
        <p>Recomendamos que você altere sua senha no primeiro acesso.</p>
      `;
      await sendEmail({ to: email, subject: 'Sua conta no Agenda Zap', html: emailHtml }).catch(e => console.error('Erro Email Webhook', e));
    }

    return { success: true };

  } catch (error) {
    console.error('[SAAS WEBHOOK PROCESSOR ERROR]', error);
    return { success: false, reason: 'Erro interno' };
  }
}
