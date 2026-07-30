import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userTenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

export async function GET(req: Request) {
  try {
    const session = verifyAuth(req);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, message: 'Tenant ID required' }, { status: 400 });

    const team = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        permissions: userTenants.permissions,
        status: users.status
      })
      .from(userTenants)
      .innerJoin(users, eq(userTenants.userId, users.id))
      .where(eq(userTenants.tenantId, tenantId));

    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ success: false, message: 'Erro ao buscar equipe.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = verifyAuth(req);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, message: 'Tenant ID required' }, { status: 400 });

    const { email, role = 'ATTENDANT', permissions = [] } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'E-mail obrigatório' }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (!user) {
      // Create new user with temp password
      const defaultPassword = 'Mudar@123';
      const passwordHash = await hashPassword(defaultPassword);
      
      const [newUser] = await db.insert(users).values({
        email: normalizedEmail,
        passwordHash,
        role,
        status: 'ACTIVE',
        mustResetPassword: true,
      }).returning();
      
      user = newUser;
    }

    // Check if already in tenant
    const [existingLink] = await db
      .select()
      .from(userTenants)
      .where(and(eq(userTenants.userId, user.id), eq(userTenants.tenantId, tenantId)))
      .limit(1);

    if (existingLink) {
      return NextResponse.json({ success: false, message: 'Usuário já faz parte da equipe.' }, { status: 400 });
    }

    // Link user to tenant
    await db.insert(userTenants).values({
      userId: user.id,
      tenantId,
      permissions
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding user to team:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
