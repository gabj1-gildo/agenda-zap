import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, tenants, systemSettings } from '@/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { message, target } = await req.json(); // target can be 'ALL', 'TENANTS', 'USERS'

    if (!message) {
      return NextResponse.json({ success: false, message: 'Mensagem vazia' }, { status: 400 });
    }

    // Fetch global whatsapp instance setting
    const instanceSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_instance_name')
    });
    const instanceName = instanceSetting?.value || 'whatsapp-vendas';

    let phoneNumbers = new Set<string>();

    if (target === 'ALL' || target === 'USERS') {
      const allUsers = await db.select({ phone: users.phone }).from(users).where(isNotNull(users.phone));
      allUsers.forEach(u => {
        if (u.phone) phoneNumbers.add(u.phone);
      });
    }

    if (target === 'ALL' || target === 'TENANTS') {
      const allTenants = await db.select({ phone: tenants.phone }).from(tenants).where(isNotNull(tenants.phone));
      allTenants.forEach(t => {
        if (t.phone) phoneNumbers.add(t.phone);
      });
    }

    const phoneList = Array.from(phoneNumbers);

    if (phoneList.length === 0) {
      return NextResponse.json({ success: false, message: 'Nenhum número de telefone encontrado' }, { status: 400 });
    }

    let successCount = 0;
    for (const phone of phoneList) {
      const sent = await sendWhatsAppMessage(phone, message, instanceName);
      if (sent) successCount++;
    }

    return NextResponse.json({ success: true, message: `Mensagem enviada para ${successCount} de ${phoneList.length} contatos.` });
  } catch (error) {
    console.error('Error broadcasting whatsapp message:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
