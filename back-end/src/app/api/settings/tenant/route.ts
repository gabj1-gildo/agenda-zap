export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, services, schedules, tenantPhones } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { r2, DeleteObjectCommand, R2_BUCKET } from '@/lib/r2';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { withTenant } from '@/db/withTenant';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    
    
    const missingRequirements = [];
    
    if (!tenant.name || tenant.name.trim() === '') missingRequirements.push('Nome da Empresa');
    if (!tenant.phone || tenant.phone.trim() === '') missingRequirements.push('Telefone / WhatsApp');
    
    const srvs = await db.select().from(services).where(eq(services.tenantId, tenantId));
    if (!srvs.some(s => s.isActive)) missingRequirements.push('Pelo menos 1 Serviço Ativo');
    
    const schs = await db.select().from(schedules).where(eq(schedules.tenantId, tenantId));
    if (!schs.some(s => s.isActive)) missingRequirements.push('Pelo menos 1 Dia de Funcionamento');
    
    // Fallback para suportar o novo modelo de múltiplas instâncias
    let phones: any[] = [];
    try {
      await withTenant(tenantId, async (tx) => {
        phones = await tx.select().from(tenantPhones).where(eq(tenantPhones.tenantId, tenantId));
      });
    } catch (err) {
      console.error('Error fetching tenant phones:', err);
    }
    
    const openPhone = phones.find(p => p.evolutionInstanceStatus?.toUpperCase() === 'OPEN' || p.evolutionInstanceStatus?.toUpperCase() === 'CONNECTED');
    if (openPhone) {
      tenant.evolutionInstanceStatus = 'OPEN';
      tenant.evolutionInstanceName = openPhone.evolutionInstanceName;
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...tenant,
        _isProfileComplete: missingRequirements.length === 0,
        _missingRequirements: missingRequirements
      } 
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[GET /api/settings/tenant] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    const body = await req.json();
    const updateData: any = {};
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.document !== undefined) updateData.document = body.document;
    if (body.cpfBirthDate !== undefined) updateData.cpfBirthDate = body.cpfBirthDate;
    if (body.cpfGender !== undefined) updateData.cpfGender = body.cpfGender;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    
    // Address fields
    if (body.cep !== undefined) updateData.cep = body.cep;
    if (body.addressStreet !== undefined) updateData.addressStreet = body.addressStreet;
    if (body.addressNumber !== undefined) updateData.addressNumber = body.addressNumber;
    if (body.addressComplement !== undefined) updateData.addressComplement = body.addressComplement;
    if (body.addressNeighborhood !== undefined) updateData.addressNeighborhood = body.addressNeighborhood;
    if (body.addressCity !== undefined) updateData.addressCity = body.addressCity;
    if (body.addressState !== undefined) updateData.addressState = body.addressState;
    if (body.serviceLocationType !== undefined) updateData.serviceLocationType = body.serviceLocationType;
    if (body.servicePerimeter !== undefined) updateData.servicePerimeter = body.servicePerimeter;
    if (body.acceptPaymentOnSite !== undefined) updateData.acceptPaymentOnSite = body.acceptPaymentOnSite;
    if (body.schedulingMode !== undefined) updateData.schedulingMode = body.schedulingMode;
    if (body.whatsappProvider !== undefined) updateData.whatsappProvider = body.whatsappProvider;
    if (body.whatsappMetaToken !== undefined) updateData.whatsappMetaToken = body.whatsappMetaToken;
    if (body.whatsappMetaPhoneNumberId !== undefined) updateData.whatsappMetaPhoneNumberId = body.whatsappMetaPhoneNumberId;
    if (body.autoCloseChats !== undefined) updateData.autoCloseChats = body.autoCloseChats;
    if (body.autoCloseHours !== undefined) updateData.autoCloseHours = body.autoCloseHours;
    
    let ignoredFields: string[] = [];
    if (body.aiConfig !== undefined) {
      if (typeof body.aiConfig !== 'object' || body.aiConfig === null) {
        return NextResponse.json({ success: false, error: 'aiConfig must be an object' }, { status: 400 });
      }

      const allowedKeys = [
        'tom_atendimento', 
        'informacoes_gerais', 
        'regras_agendamento', 
        'instrucoes_pagamento', 
        'restricoes', 
        'regras_transbordo', 
        'mensagem_encerramento',
        'ai_provider',
        'ai_model',
        'preset_id'
      ];
      
      const MAX_LENGTH = 2000;
      
      // Criar um novo objeto apenas com as chaves válidas para evitar sobrescrever a coluna com lixo
      const sanitizedAiConfig: any = {};
      
      for (const key of Object.keys(body.aiConfig)) {
        if (!allowedKeys.includes(key)) {
          ignoredFields.push(key);
          continue;
        }
        const val = body.aiConfig[key];
        if (val && typeof val === 'string' && val.length > MAX_LENGTH) {
          return NextResponse.json({ success: false, error: `O campo '${key}' ultrapassa o limite máximo de ${MAX_LENGTH} caracteres.` }, { status: 400 });
        }
        sanitizedAiConfig[key] = val;
      }
      
      // Mantém os dados antigos de aiConfig que não foram enviados no body,
      // incluindo os campos legados servicos_precos e horario_funcionamento.
      const currentAiConfig = (tenant?.aiConfig as any) || {};
      updateData.aiConfig = { ...currentAiConfig, ...sanitizedAiConfig };
    }

    if (body.logoUrl !== undefined && tenant) {
      if (body.logoUrl !== tenant.logoUrl && tenant.logoUrl) {
        // Excluir a logo antiga do R2
        const match = tenant.logoUrl.match(/(users|tenants|misc)\/.+/);
        const pathToDelete = match ? match[0] : null;
        if (pathToDelete) {
          try {
            await r2.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: pathToDelete,
              })
            );
          } catch (error) {
            console.error('Erro ao deletar logo antiga do R2:', error);
          }
        }
      }
      updateData.logoUrl = body.logoUrl;
    }

    const [updated] = await db.update(tenants)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning();

    return NextResponse.json({ success: true, data: updated, ignoredFields });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PATCH /api/settings/tenant] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
