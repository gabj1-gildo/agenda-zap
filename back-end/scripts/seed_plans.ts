import { db } from '../src/db';
import { plans } from '../src/db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('🌱 Iniciando Seed de Planos...');

  const plansData = [
    {
      name: 'Básico',
      description: 'Perfeito para autônomos e pequenos negócios.',
      price: '49.90',
      interval: 'monthly',
      maxTenants: 1,
      maxUsers: 1,
      maxAppointmentsPerMonth: 100,
      includedChats: 100,
      extraChatPrice: '0.20',
      trialDays: 7,
      features: [
        { name: '1 Agenda', included: true },
        { name: 'IA para agendamento (100 chats)', included: true },
        { name: 'Lembretes no WhatsApp', included: true },
        { name: 'Múltiplos Atendentes', included: false },
        { name: 'Múltiplas Filiais', included: false }
      ]
    },
    {
      name: 'Profissional',
      description: 'Para negócios que precisam de mais poder de atendimento.',
      price: '99.90',
      interval: 'monthly',
      maxTenants: 1,
      maxUsers: 3,
      maxAppointmentsPerMonth: 500,
      includedChats: 500,
      extraChatPrice: '0.15',
      trialDays: 7,
      features: [
        { name: 'Até 3 Atendentes (Logins)', included: true },
        { name: 'IA para agendamento (500 chats)', included: true },
        { name: 'Lembretes no WhatsApp', included: true },
        { name: 'Gestão de Funil CRM', included: true },
        { name: 'Múltiplas Filiais', included: false }
      ]
    },
    {
      name: 'Premium',
      description: 'Tudo liberado para redes e clínicas.',
      price: '199.90',
      interval: 'monthly',
      maxTenants: 5,
      maxUsers: 10,
      maxAppointmentsPerMonth: 2000,
      includedChats: 2000,
      extraChatPrice: '0.10',
      trialDays: 7,
      features: [
        { name: 'Até 10 Atendentes', included: true },
        { name: 'Até 5 Filiais', included: true },
        { name: 'IA para agendamento (2000 chats)', included: true },
        { name: 'Lembretes no WhatsApp', included: true },
        { name: 'Gestão de Funil CRM', included: true }
      ]
    }
  ];

  try {
    for (const plan of plansData) {
      await db.insert(plans).values(plan);
      console.log(`✅ Plano inserido: ${plan.name}`);
    }
    console.log('🎉 Seed finalizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed:', err);
  }
  process.exit(0);
}

run();
