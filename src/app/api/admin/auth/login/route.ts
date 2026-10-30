import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  signAdminSession,
  ADMIN_COOKIE_NAME,
  SUPER_ADMIN_PERMISSIONS,
  AdminPermissions,
  INACTIVITY_TIMEOUT_MS,
} from '@/lib/auth/admin-session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // ─────────────────────────────────────────────────────────────
    // TYPE A: SUPER ADMIN (CONSTANT MASTER PASSWORD LOGIN)
    // ─────────────────────────────────────────────────────────────
    if (type === 'super_admin') {
      const { username, password } = body;
      const expectedPassword = process.env.SUPER_ADMIN_PASSWORD || 'BirsaMunda@2026';

      if (!password || password !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid Super Admin password. Please check your credentials.' },
          { status: 401 }
        );
      }

      const adminName = username ? username.trim() : 'Chief Organizer';
      const now = Date.now();

      const sessionPayload = {
        role: 'super_admin' as const,
        adminId: 'super-admin-01',
        username: username || 'superadmin',
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
        maxAge: Math.floor(INACTIVITY_TIMEOUT_MS / 1000) * 4, // Cookie life
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin authenticated successfully with full system privileges.',
        session: {
          role: 'super_admin',
          name: adminName,
          permissions: SUPER_ADMIN_PERMISSIONS,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // TYPE B: DELEGATED ADMIN / REQUESTER (PHONE + OTP LOGIN)
    // ─────────────────────────────────────────────────────────────
    if (type === 'sub_admin') {
      const { phone, otp } = body;

      if (!phone || !otp) {
        return NextResponse.json(
          { success: false, error: 'Both phone number and OTP are required for Sub-Admin login.' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      // Verify OTP (accept standard sandbox OTP 123456 for testing)
      if (otp !== '123456' && otp !== '000000') {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. For test verification, use 123456.' },
          { status: 401 }
        );
      }

      // Check access request approval status in Supabase
      const admin = createAdminClient();
      const { data: request, error: dbError } = await admin
        .from('admin_access_requests')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
        .maybeSingle();

      if (dbError || !request) {
        return NextResponse.json(
          {
            success: false,
            error: 'No admin access record found for this mobile number. Please submit an Admin Access Request first.',
          },
          { status: 404 }
        );
      }

      if (request.status === 'pending') {
        return NextResponse.json(
          {
            success: false,
            error: 'Your Admin Access Request is still PENDING approval from the Main Admin. You will be able to log in once approved.',
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

      const grantedPermissions: AdminPermissions = {
        can_moderate_videos: Boolean(request.permissions?.can_moderate_videos),
        can_manage_contest: Boolean(request.permissions?.can_manage_contest),
        can_view_audit_logs: Boolean(request.permissions?.can_view_audit_logs),
        can_export_data: Boolean(request.permissions?.can_export_data),
        can_view_analytics: Boolean(request.permissions?.can_view_analytics ?? true),
        can_manage_admins: false, // Only super admin can manage admins
      };

      const now = Date.now();
      const sessionPayload = {
        role: 'sub_admin' as const,
        adminId: request.id,
        username: request.email || cleanPhone,
        name: request.full_name || 'Staff Admin',
        phone: request.phone,
        email: request.email,
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
        message: 'Delegated Admin logged in successfully with assigned role permissions.',
        session: {
          role: 'sub_admin',
          name: request.full_name,
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

