import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { r2, DeleteObjectCommand, R2_BUCKET } from '@/lib/r2';

export async function GET(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.id));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        cpf: user.cpf,
        gender: user.gender,
        socialName: user.socialName,
        birthDate: user.birthDate
      } 
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, username, avatarUrl, phone, cpf, gender, socialName, birthDate } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    
    // Check if username is already taken
    if (username) {
      const existing = await db.select().from(users).where(eq(users.username, username));
      if (existing.length > 0 && existing[0].id !== session.id) {
        return NextResponse.json({ success: false, error: 'Nome de usuário já está em uso.' }, { status: 400 });
      }
    }

    if (avatarUrl !== undefined) {
      const [currentUser] = await db.select({ avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, session.id));
      if (currentUser && currentUser.avatarUrl && avatarUrl !== currentUser.avatarUrl) {
        // Excluir avatar antigo do R2
        const match = currentUser.avatarUrl.match(/(users|tenants|misc)\/.+/);
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
            console.error('Erro ao deletar avatar antigo do R2:', error);
          }
        }
      }
    }

    await db.update(users).set({ 
      name, 
      username, 
      avatarUrl, 
      phone, 
      cpf, 
      gender, 
      socialName, 
      birthDate,
      updatedAt: new Date() 
    }).where(eq(users.id, session.id));

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
