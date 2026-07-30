import { env } from '@/config/env';

export async function findOrCreateAsaasCustomer(name: string, email: string, cpfCnpj: string, phone: string) {
  const token = env.ASAAS_API_KEY;
  const baseUrl = env.ASAAS_API_URL;
  if (!token) throw new Error('ASAAS_API_KEY não configurada');

  // Tenta encontrar cliente por e-mail ou CPF
  const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, {
    headers: { 'access_token': token }
  });
  const searchData = await searchRes.json();
  
  if (searchData?.data?.length > 0) {
    return searchData.data[0].id;
  }

  // Cria cliente
  const createRes = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': token },
    body: JSON.stringify({ name, email, cpfCnpj, mobilePhone: phone })
  });
  
  const createData = await createRes.json();
  if (createData.errors) {
    console.error('Erro Asaas Customer:', createData.errors);
    throw new Error('Falha ao criar cliente no Asaas: ' + createData.errors[0].description);
  }
  
  return createData.id;
}

export async function createAsaasSaasSubscription(customerId: string, amount: number, externalReference: string, description: string) {
  const token = env.ASAAS_API_KEY;
  const baseUrl = env.ASAAS_API_URL;
  if (!token) throw new Error('ASAAS_API_KEY não configurada');

  // Cria assinatura (Mensal) - Por padrão, usamos UNDEFINED para billingType para que o usuário escolha no link
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate()); // Vence hoje
  
  const res = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': token },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'UNDEFINED', 
      value: amount,
      nextDueDate: dueDate.toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description,
      externalReference
    })
  });

  const data = await res.json();
  if (data.errors) {
    console.error('Erro Asaas Subscription:', data.errors);
    throw new Error('Falha ao gerar assinatura no Asaas');
  }

  // Uma Subscription cria uma Payment (fatura) automaticamente que tem o invoiceUrl
  // Vamos buscar a primeira fatura para retornar o link de pagamento
  const invRes = await fetch(`${baseUrl}/payments?subscription=${data.id}`, {
    headers: { 'access_token': token }
  });
  const invData = await invRes.json();
  const invoiceUrl = invData?.data?.[0]?.invoiceUrl || null;

  return { subscriptionId: data.id, invoiceUrl };
}

export async function createAsaasSaasCharge(customerId: string, amount: number, externalReference: string, description: string, maxInstallments: number) {
  const token = env.ASAAS_API_KEY;
  const baseUrl = env.ASAAS_API_URL;
  if (!token) throw new Error('ASAAS_API_KEY não configurada');

  const dueDate = new Date();
  
  // Cria cobrança à vista (mas no cartão ele pode parcelar pela interface do Asaas se billingType for UNDEFINED)
  // Porém o Asaas só permite parcelar uma "Cobrança Parcelada" explícita se feita via API.
  // Se gerarmos um Link de Pagamento genérico, o cliente escolhe a forma.
  
  // A melhor forma de suportar PIX/Cartão/Boleto e parcelamento é usando um Payment Link (que não atrela diretamente ao customer da mesma forma, mas atrela).
  // Porém, queremos atrelar ao Customer. Podemos criar uma "Cobrança" (Payment) com billingType UNDEFINED. O cliente abre a URL e escolhe.
  
  const res = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': token },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'UNDEFINED',
      value: amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description,
      externalReference
    })
  });

  const data = await res.json();
  if (data.errors) {
    console.error('Erro Asaas Charge:', data.errors);
    throw new Error('Falha ao gerar cobrança no Asaas');
  }

  return { chargeId: data.id, invoiceUrl: data.invoiceUrl };
}
