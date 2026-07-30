import { NextResponse } from 'next/server';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { r2, PutObjectCommand, DeleteObjectCommand, R2_BUCKET } from '@/lib/r2';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado. A sessão pode ter expirado, faça login novamente.' }, { status: 401 });
    }

    const tenantId = req.headers.get('tenant-id');
    
    // Opcional: Validar se o usuário tem acesso ao tenantId caso seja enviado
    if (tenantId && !canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'misc';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Criar um nome único
    const ext = file.name.split('.').pop();
    const uniqueId = crypto.randomUUID();
    
    // Exemplo de path: tenants/id/logo/uuid.png ou users/id/avatar/uuid.png
    let filePath = '';
    
    if (folder === 'logo' && tenantId) {
      filePath = `tenants/${tenantId}/logo/${uniqueId}.${ext}`;
    } else if (folder === 'avatar') {
      filePath = `users/${user.id}/avatar/${uniqueId}.${ext}`;
    } else {
      filePath = `misc/${uniqueId}.${ext}`;
    }

    // Transformar o arquivo em Uint8Array para upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: file.type,
        })
      );
    } catch (error: any) {
      console.error('Erro no upload para o R2:', error);
      return NextResponse.json({ success: false, error: `Erro no R2: ${error.message || 'Desconhecido'} (Bucket: ${R2_BUCKET})` }, { status: 500 });
    }

    // A URL que vamos salvar no banco será a URL pública do Cloudflare R2
    const publicUrlBase = process.env.R2_PUBLIC_URL;
    
    // Se a variável R2_PUBLIC_URL existir, usamos ela, caso contrário usamos o backend como proxy absoluto
    // É altamente recomendado preencher a R2_PUBLIC_URL no Render
    const secureUrl = publicUrlBase 
      ? `${publicUrlBase}/${filePath}` 
      : `${process.env.APP_URL || 'http://localhost:3001'}/api/media/${filePath}`;

    return NextResponse.json({ success: true, url: secureUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }
    
    const body = await req.json();
    const { url } = body;
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL não fornecida.' }, { status: 400 });
    }

    // Extrai de forma segura o path, não importa qual domínio foi salvo no banco (R2 público ou proxy local)
    const match = url.match(/(users|tenants|misc)\/.+/);
    const pathToDelete = match ? match[0] : null;
    
    if (pathToDelete) {
      // Basic security check: if it's a tenant logo, must have access
      if (pathToDelete.startsWith('tenants/')) {
        const parts = pathToDelete.split('/');
        const tId = parts[1];
        if (tId && !canAccessTenant(user, tId)) {
          return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }
      } else if (pathToDelete.startsWith('users/')) {
        const parts = pathToDelete.split('/');
        const uId = parts[1];
        if (uId && user.id !== uId && user.role !== 'SUPERADMIN') {
          return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }
      }

      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: pathToDelete,
          })
        );
      } catch (error) {
        console.error('Erro ao deletar do R2:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
