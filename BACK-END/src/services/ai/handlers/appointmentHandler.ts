import { db } from '@/db';
import { appointments, services } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createCheckoutPayment } from '../../paymentService';
import { handleCheckAvailability } from './checkAvailabilityHandler';
import { dispatchWebhook } from '@/services/webhookDispatcher';

export async function handleCreateAppointment(
  args: any,
  tenant: any,
  client: any
): Promise<string[]> {
    const { serviceId, dateIso, professionalId, roomId } = args;

    return await db.transaction(async (tx) => {
      // Lock the tenant row to serialize appointment creations for this tenant
      // This strictly prevents race conditions without complex range locks
      await tx.execute(sql`SELECT 1 FROM tenants WHERE id = ${tenant.id} FOR UPDATE`);

      // 1. Validar e buscar preço/nome real na tabela serviços
      const serviceList = await tx.select().from(services).where(eq(services.id, serviceId));
      const service = serviceList[0];
      if (!service || service.tenantId !== tenant.id) {
        return ["Não encontrei este serviço na nossa base. Pode tentar novamente?"];
      }

      // 2. Extrair apenas a data para checar a disponibilidade do dia
      const dateStr = dateIso.split('T')[0];
      // Passamos o preference para a disponibilidade
      const availabilityRes = await handleCheckAvailability({ 
        serviceId, 
        dateIso: dateStr, 
        preferredProfessionalId: professionalId, 
        preferredRoomId: roomId 
      }, tenant);
      
      if (availabilityRes.error) {
        return [availabilityRes.error];
      }

      // Verificar se a hora desejada ainda está na lista de slots livres
      const targetDate = new Date(dateIso);
      const strTime = targetDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      
      const slot = availabilityRes.availableSlots?.find((s:any) => s.time === strTime);
      if (!slot) {
        return [
          `Infelizmente o horário das ${strTime} acabou de ser ocupado ou não está mais disponível.`,
          `Estes são os horários livres para este dia: ${availabilityRes.availableSlots ? availabilityRes.availableSlots.map((s:any)=>s.time).join(', ') : 'Nenhum'}`
        ];
      }

      console.log(`IA Solicitou Agendamento: ${service.name} para ${dateIso} via ${args.paymentMethod}`);
      
      // 3. Gerar o link de Checkout
      let paymentId = 'MOCK_PAYMENT_' + Date.now();
      let checkoutUrl = '';
      
      try {
        const paymentData = await createCheckoutPayment(
          Number(service.price), 
          `Agendamento: ${service.name}`, 
          tenant.id,
          args.paymentMethod
        );
        paymentId = paymentData.paymentId;
        checkoutUrl = paymentData.checkoutUrl || '';
      } catch (e) {
        console.log("Aviso: Falha ao gerar pagamento, seguindo com mock para fins de teste:", e);
      }
      
      // 4. Salvar o agendamento no banco como PENDENTE
      const [newAppointment] = await tx.insert(appointments).values({
        date: targetDate,
        serviceName: service.name,
        serviceId: service.id,
        price: String(service.price),
        status: 'PENDENTE',
        paymentId: paymentId,
        clientId: client.id,
        tenantId: tenant.id,
        professionalId: professionalId || null,
        roomId: roomId || null
      }).returning();

      // Dispatch APPOINTMENT_CREATED event
      dispatchWebhook(tenant.id, 'APPOINTMENT_CREATED', newAppointment).catch(console.error);

    // 5. Devolver uma resposta em array para que a IA envie as mensagens
    const messages = [
      `✅ *Agendamento Confirmado!*\n\nServiço: ${service.name}\nData/Hora: ${targetDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\nValor: R$ ${service.price}\n\nPara garantir sua vaga, realize o pagamento acessando o link seguro abaixo:`
    ];
    
    if (checkoutUrl) {
      messages.push(`🔗 Pagar Agora: ${checkoutUrl}`);
      if (tenant.acceptPaymentOnSite) {
        messages.push(`Ou, se preferir, pode realizar o pagamento no local no momento do atendimento. Confirme se essa é sua preferência.`);
      }
    } else {
      messages.push(`(Houve um problema ao gerar o link de pagamento. O lojista entrará em contato.)`);
    }
    
    messages.push(`Assim que o pagamento for confirmado, te avisarei por aqui!`);
    
    return messages;
  });
}
