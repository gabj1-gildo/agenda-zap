import 'dotenv/config';
import { db } from './index';
import { planFeatures } from './schema';

async function seedGlobalFeatures() {
  console.log("Seeding global features...");
  
  const features = [
    "WhatsApp Ilimitado",
    "Agendamento via IA (ChatGPT)",
    "Controle Múltiplos Atendentes",
    "Relatórios Financeiros Avançados",
    "Disparo de Campanhas em Massa",
    "Treinamento de IA Personalizado",
    "Integração com Google Calendar",
    "Lembretes Automáticos (WhatsApp)",
    "Acesso a API",
    "Suporte Prioritário"
  ];

  try {
    for (const name of features) {
      await db.insert(planFeatures).values({ name }).onConflictDoNothing();
    }
    console.log("Global features seeded successfully!");
  } catch (e) {
    console.error("Error seeding features:", e);
  }
  process.exit(0);
}

seedGlobalFeatures();
