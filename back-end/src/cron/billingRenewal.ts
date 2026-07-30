import cron from 'node-cron';
import { processBillingRenewals } from '@/services/billingService';

export async function runBillingRenewal() {
  console.log('🔄 [CRON] Verificando assinaturas próximas ao vencimento (10 dias)...');
  
  try {
    const result = await processBillingRenewals();
    console.log(`✅ [CRON] Varredura de assinaturas finalizada. Processados: ${result.processed}`);
  } catch (error) {
    console.error('❌ [CRON] Erro ao rodar rotina de renovação:', error);
  }
}

// Agendar para rodar todos os dias às 02:00 da manhã
export function initCronJobs() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
    cron.schedule('0 2 * * *', () => {
      runBillingRenewal();
    });
    console.log('⏰ Cron Jobs iniciados.');
  }
}
