import { NextResponse } from 'next/server';
import { runDatabaseBackup } from '@/services/backupService';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Retorna 401 para evitar execução não autorizada do backup
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Inicia o backup de forma assíncrona para não prender a resposta
    runDatabaseBackup().catch(err => console.error('Erro na execução assíncrona do backup via API:', err));

    return NextResponse.json({ success: true, message: 'Backup job triggered successfully in background' });
  } catch (error) {
    console.error('Erro no endpoint de backup:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
