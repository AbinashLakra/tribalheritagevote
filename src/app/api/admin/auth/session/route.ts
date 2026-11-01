import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  getAdminSession,
  signAdminSession,
  INACTIVITY_TIMEOUT_MS,
} from '@/lib/auth/admin-session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // getAdminSession verifies token signature, checks 15-min timeout,
  // and dynamically syncs permissions with Supabase in real-time
  const session = await getAdminSession();
  if (!session) {
    cookieStore.delete(ADMIN_COOKIE_NAME);
    return NextResponse.json(
      { authenticated: false, reason: 'invalid_or_revoked_session' },
      { status: 401 }
    );
  }

  // Activity Refresh (Sliding session window while user is actively clicking)
  const updatedSession = {
    ...session,
    lastActive: Date.now(),
  };

  const newToken = signAdminSession(updatedSession);
  cookieStore.set(ADMIN_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(INACTIVITY_TIMEOUT_MS / 1000) * 4,
  });

  return NextResponse.json({
    authenticated: true,
    session: {
      role: session.role,
      name: session.name,
      adminId: session.adminId,
      assignedPanel: session.assignedPanel,
      email: session.email,
      phone: session.phone,
      permissions: session.permissions,
      loginAt: session.loginAt,
      lastActive: updatedSession.lastActive,
    },
  });
}
