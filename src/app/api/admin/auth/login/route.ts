import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  signAdminSession,
  ADMIN_COOKIE_NAME,
  SUPER_ADMIN_PERMISSIONS,
  CO_ADMIN_PERMISSIONS,
  PANEL_ADMIN_PERMISSIONS,
  AdminPermissions,
  INACTIVITY_TIMEOUT_MS,
} from '@/lib/auth/admin-session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // ─────────────────────────────────────────────────────────────
    // TYPE A: SUPER ADMIN (CONSTANT MASTER CREDENTIALS LOGIN)
    // Username: Admin
    // Password: Admin@6789$
    // ─────────────────────────────────────────────────────────────
    if (type === 'super_admin') {
      const { username, password } = body;
      const isPasswordValid =
        password === 'Admin@6789$' ||
        password === (process.env.SUPER_ADMIN_PASSWORD || 'Admin@6789$');

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid Super Admin master password. Please verify your credentials.' },
          { status: 401 }
        );
      }

      const adminName = 'Super Admin';
      const now = Date.now();

      const sessionPayload = {
        role: 'super_admin' as const,
        adminId: 'super-admin-01',
        username: 'Admin',
        name: adminName,
        permissions: SUPER_ADMIN_PERMISSIONS,
        loginAt: now,
        lastActive: now,
      };

      const token = signAdminSession(sessionPayload);
      const cookieStore = await cookies();

      cookieStore.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(INACTIVITY_TIMEOUT_MS / 1000) * 4,
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin authenticated successfully with full master privileges.',
        session: {
          role: 'super_admin',
          name: adminName,
          permissions: SUPER_ADMIN_PERMISSIONS,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // TYPE B: DELEGATED SUB-ADMIN / PANEL ADMIN / CO-ADMIN
    // Username: Email ID
    // Password: Mobile Phone Number (No OTP required)
    // ─────────────────────────────────────────────────────────────
    if (type === 'sub_admin' || type === 'panel_admin') {
      const emailInput = (body.email || body.username || '').trim().toLowerCase();
      const passwordInput = (body.password || '').trim();

      if (!emailInput || !passwordInput) {
        return NextResponse.json(
          { success: false, error: 'Both Email ID (Username) and Mobile Phone Number (Password) are required.' },
          { status: 400 }
        );
      }

      const cleanPasswordPhone = passwordInput.replace(/\D/g, '').slice(-10);
      if (!cleanPasswordPhone || cleanPasswordPhone.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'Password must be your registered 10-digit Indian mobile number.' },
          { status: 400 }
        );
      }

      // Check access request approval status in Supabase
      const admin = createAdminClient();
      const { data: request, error: dbError } = await admin
        .from('admin_access_requests')
        .select('*')
        .ilike('email', emailInput)
        .maybeSingle();

      if (dbError || !request) {
        return NextResponse.json(
          {
            success: false,
            error: 'No admin record found for this Email address. Please submit an Admin Access Request first.',
          },
          { status: 404 }
        );
      }

      // Verify that password matches the registered phone number
      const storedPhoneClean = request.phone.replace(/\D/g, '').slice(-10);
      if (cleanPasswordPhone !== storedPhoneClean) {
        return NextResponse.json(
          {
            success: false,
            error: 'Incorrect password. For delegated admins, your password is your registered 10-digit mobile number.',
          },
          { status: 401 }
        );
      }

      if (request.status === 'pending') {
        return NextResponse.json(
          {
            success: false,
            error: 'Your Admin Access Request is still PENDING approval from the Main Admin. Once approved, you can log in directly.',
          },
          { status: 403 }
        );
      }

      if (request.status === 'rejected' || request.status === 'revoked') {
        return NextResponse.json(
          {
            success: false,
            error: 'Your admin privileges have been rejected or revoked by the Main Admin.',
          },
          { status: 403 }
        );
      }

      const roleType = (request.role_type as 'co_admin' | 'panel_admin') || 'panel_admin';
      const assignedPanel = (request.assigned_panel as 1 | 2 | 3 | 4) || 1;

      let grantedPermissions: AdminPermissions;
      if (roleType === 'co_admin') {
        grantedPermissions = CO_ADMIN_PERMISSIONS;
      } else {
        grantedPermissions = {
          can_moderate_videos: Boolean(request.permissions?.can_moderate_videos ?? true),
          can_manage_contest: false,
          can_view_audit_logs: false,
          can_export_data: false,
          can_view_analytics: Boolean(request.permissions?.can_view_analytics ?? true),
          can_manage_admins: false,
        };
      }

      const now = Date.now();
      const sessionPayload = {
        role: roleType,
        adminId: request.id,
        username: request.email,
        name: request.full_name || 'Panel Admin',
        phone: request.phone,
        email: request.email,
        assignedPanel: roleType === 'panel_admin' ? assignedPanel : null,
        permissions: grantedPermissions,
        loginAt: now,
        lastActive: now,
      };

      const token = signAdminSession(sessionPayload);
      const cookieStore = await cookies();

      cookieStore.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(INACTIVITY_TIMEOUT_MS / 1000) * 4,
      });

      return NextResponse.json({
        success: true,
        message: `${request.full_name || 'Admin'} authenticated successfully!`,
        session: {
          role: roleType,
          name: request.full_name,
          email: request.email,
          assignedPanel: roleType === 'panel_admin' ? assignedPanel : null,
          permissions: grantedPermissions,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid login type specified. Choose super_admin or sub_admin.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during admin authentication.' },
      { status: 500 }
    );
  }
}
