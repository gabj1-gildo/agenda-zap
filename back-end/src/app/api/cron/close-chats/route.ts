import { NextResponse } from 'next/server';
import { processCloseChats } from '@/services/chatProcessor';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'secret-cron-token';
    
    // Se quiser manter seguro:
    // if (authHeader !== `Bearer ${expectedToken}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await processCloseChats();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error closing chats route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
