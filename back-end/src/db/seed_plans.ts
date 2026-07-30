import { db } from './index';
import { plans } from './schema/plans';
import * as dotenv from 'dotenv';
import { env } from '@/config/env';

dotenv.config();

async function main() {
  console.log('🌱 Semeando Planos SaaS...');

  const token = process.env.MP_ACCESS_TOKEN || env.MP_ACCESS_TOKEN;
  let mpConfigured = false;
  
  if (token && !token.includes('APP_USR-7921804151723689')) { // simple check to ignore the dummy token
    mpConfigured = true;
  } else {
    console.warn('⚠️ Token do Mercado Pago não configurado (ou usando token de teste). Os planos serão criados no BD sem ID do Mercado Pago.');
  }

  // Limpar planos antigos antes de semear
  await db.delete(plans);
  console.log('🧹 Planos antigos removidos do banco.');

  const defaultPlans = [
    {
      name: 'Pro',
      description: 'Perfeito para pequenas clínicas',
      price: '99.90',
      interval: 'monthly' as const,
      maxUsers: 3,
      maxTenants: 1,
      includedChats: 300,
      extraChatPrice: '0.15',
      features: [
        { name: '3 Usuários', included: true },
        { name: 'Serviços Ilimitados', included: true },
        { name: '300 Chats Inclusos', included: true },
        { name: 'Multi-Filiais', included: false },
      ],
    },
    {
      name: 'Premium',
      description: 'Para redes de clínicas e múltiplas filiais',
      price: '199.90',
      interval: 'monthly' as const,
      maxUsers: 5,
      maxTenants: 3,
      includedChats: 300,
      extraChatPrice: '0.15',
      features: [
        { name: '5 Usuários/Filial', included: true },
        { name: 'Serviços Ilimitados', included: true },
        { name: '300 Chats Inclusos/Filial', included: true },
        { name: 'Até 3 Filiais', included: true },
      ],
    }
  ];

  for (const planData of defaultPlans) {
    let mpPlanId = null;

    if (mpConfigured) {
      try {
        const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval_plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: planData.name,
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: Number(planData.price),
              currency_id: "BRL"
            },
            back_url: `${env.FRONTEND_URL}/billing`
          })
        });
        const mpData = await response.json();
        if (response.ok) {
          mpPlanId = mpData.id;
          console.log(`✅ Plano ${planData.name} criado no MP: ${mpPlanId}`);
        } else {
          console.error(`❌ Erro ao criar plano ${planData.name} no MP:`, mpData);
        }
      } catch (err) {
        console.error(`❌ Erro na requisição MP para ${planData.name}`, err);
      }
    }

    const [created] = await db.insert(plans).values({
      ...planData,
      mpPlanId: mpPlanId
    }).returning();
    
    console.log(`✅ Plano DB Criado: ${created.name}`);
  }

  console.log('🏁 Seed de Planos concluído.');
}

main().catch(console.error).finally(() => process.exit(0));
