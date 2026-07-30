import { db } from '../src/db';
import { tenants } from '../src/db/schema/tenants';

async function run() {
  try {
    const dummyText = `Corte de cabelo = R$ 50,00
Barba - R$ 35
Combo Corte + Barba por apenas 70
Maquiagem R$120.50
Temos os melhores serviços da região!
Consulte nossos preços no balcão.
Luzes = 150`;

    await db.insert(tenants).values({
      name: 'Barbearia Teste IA (Migration)',
      phone: `55119${Math.floor(Math.random() * 10000000)}`,
      aiConfig: { servicos_precos: dummyText },
    });

    console.log("Tenant de teste criado com sucesso.");
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    process.exit(0);
  }
}
run();
