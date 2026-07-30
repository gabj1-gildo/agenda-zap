import { NextResponse } from 'next/server';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { r2, GetObjectCommand, R2_BUCKET } from '@/lib/r2';

// Helper config to ignore body warnings in Next.js GET routes if any
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    
    // O caminho completo dentro do bucket do Supabase (ex: tenants/123/logo/uuid.png)
    const filePath = path.join('/');

    // Verificar Autenticação
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Acesso Restrito / Segurança
    // Se o caminho acessado for de uma empresa (tenants/X/...)
    if (path[0] === 'tenants' && path[1]) {
      const targetTenantId = path[1];
      if (!canAccessTenant(user, targetTenantId)) {
        return NextResponse.json({ success: false, error: 'Forbidden. You do not have access to this tenant media.' }, { status: 403 });
      }
    }
    
    // Se o caminho for avatar de usuário (users/X/...)
    // Apenas o dono ou superadmin pode acessar (ou pode ser público dentro da plataforma? Por enquanto restrito)
    if (path[0] === 'users' && path[1]) {
      const targetUserId = path[1];
      if (user.id !== targetUserId && user.role !== 'SUPERADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden. You do not have access to this user media.' }, { status: 403 });
      }
    }

    // Buscar o arquivo no R2
    let fileData;
    try {
      fileData = await r2.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: filePath,
        })
      );
    } catch (error) {
      console.error('Erro ao baixar arquivo do R2:', error);
      return NextResponse.json({ success: false, error: 'Arquivo não encontrado' }, { status: 404 });
    }

    if (!fileData || !fileData.Body) {
      return NextResponse.json({ success: false, error: 'Arquivo vazio' }, { status: 404 });
    }

    const byteArray = await fileData.Body.transformToByteArray();

    // Criar response
    const headers = new Headers();
    headers.set('Content-Type', fileData.ContentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache aggressively
    
    return new NextResponse(Buffer.from(byteArray), {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    console.error('Media Proxy Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
