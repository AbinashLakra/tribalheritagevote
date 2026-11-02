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
    // ─────────────────────────────────────────────────────────────
    // TYPE A: SUPER ADMIN (CONSTANT MASTER CREDENTIALS LOGIN)
    // Username: Admin
    // Password: Admin@6789$
    // Also supports Second Main Admin logging in from the Main Admin tab!
    // ─────────────────────────────────────────────────────────────
    if (type === 'super_admin') {
      const { username = '', password = '' } = body;
      const trimmedUser = (username || '').trim();
      const trimmedPass = (password || '').trim();

      const isMasterSuperAdmin =
        (trimmedPass === 'Admin@6789$' || trimmedPass === (process.env.SUPER_ADMIN_PASSWORD || 'Admin@6789$')) &&
        (trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase() === 'superadmin' || !trimmedUser);

      if (isMasterSuperAdmin) {
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

      // Check if Second Main Admin (co_admin) is attempting login through Tab 1
      const admin = createAdminClient();
      const cleanPhoneInput = trimmedUser.replace(/\D/g, '').slice(-10);
      const cleanPassPhone = trimmedPass.replace(/\D/g, '').slice(-10);

      let query = admin.from('admin_access_requests').select('*');
      if (cleanPhoneInput && cleanPhoneInput.length === 10) {
        query = query.or(`phone.eq.${cleanPhoneInput},phone.eq.+91${cleanPhoneInput},email.ilike.${trimmedUser},full_name.ilike.%${trimmedUser}%`);
      } else {
        query = query.or(`email.ilike.${trimmedUser},full_name.ilike.%${trimmedUser}%`);
      }

      const { data: coAdminReq } = await query.maybeSingle();

      if (coAdminReq && (coAdminReq.role_type === 'co_admin' || coAdminReq.permissions?.requested_role === 'main_admin')) {
        const storedCleanPhone = coAdminReq.phone.replace(/\D/g, '').slice(-10);
        const passwordMatches = cleanPassPhone === storedCleanPhone || trimmedPass === storedCleanPhone || trimmedPass === 'Admin@6789$';

        if (passwordMatches) {
          if (coAdminReq.status === 'pending') {
            return NextResponse.json(
              {
                success: false,
                error: 'Your Second Main Admin application is currently PENDING approval from the Super Admin.',
              },
              { status: 403 }
            );
          }
          if (coAdminReq.status === 'approved') {
            const now = Date.now();
            const sessionPayload = {
              role: 'co_admin' as const,
              adminId: coAdminReq.id,
              username: coAdminReq.email,
              name: coAdminReq.full_name || 'Second Main Admin',
              phone: coAdminReq.phone,
              email: coAdminReq.email,
              assignedPanel: null,
              permissions: CO_ADMIN_PERMISSIONS,
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
              message: `Second Main Admin authenticated successfully! Welcome ${coAdminReq.full_name}.`,
              session: {
                role: 'co_admin',
                name: coAdminReq.full_name,
                email: coAdminReq.email,
                permissions: CO_ADMIN_PERMISSIONS,
              },
            });
          }
        }
      }

      return NextResponse.json(
        { success: false, error: 'Invalid Super Admin credentials. For Super Admin use master password, or for Second Main Admin use your registered phone number.' },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // TYPE B: DELEGATED SUB-ADMIN / PANEL ADMIN / CO-ADMIN
    // Username: Email ID, Phone Number, or Full Name
    // Password: Mobile Phone Number (No OTP required)
    // ─────────────────────────────────────────────────────────────
    if (type === 'sub_admin' || type === 'panel_admin') {
      const userInput = (body.email || body.username || '').trim();
      const passwordInput = (body.password || '').trim();

      if (!userInput || !passwordInput) {
        return NextResponse.json(
          { success: false, error: 'Both Username (Email, Mobile, or Name) and Password (Mobile Number) are required.' },
          { status: 400 }
        );
      }

      const cleanPasswordPhone = passwordInput.replace(/\D/g, '').slice(-10);
      const cleanUserPhone = userInput.replace(/\D/g, '').slice(-10);

      // Check access request approval status in Supabase
      const admin = createAdminClient();
      let query = admin.from('admin_access_requests').select('*');

      if (cleanUserPhone && cleanUserPhone.length === 10) {
        query = query.or(`phone.eq.${cleanUserPhone},phone.eq.+91${cleanUserPhone},email.ilike.${userInput},full_name.ilike.%${userInput}%`);
      } else {
        query = query.or(`email.ilike.${userInput},full_name.ilike.%${userInput}%`);
      }

      const { data: request, error: dbError } = await query.maybeSingle();

      if (dbError || !request) {
        return NextResponse.json(
          {
            success: false,
            error: 'No administrator record found for this username (Email, Mobile, or Name). Please verify your entry or submit an Admin Access Request first.',
          },
          { status: 404 }
        );
      }

      // Verify password matches registered phone number (or emergency bypass)
      const storedPhoneClean = request.phone.replace(/\D/g, '').slice(-10);
      const isPasswordCorrect =
        (cleanPasswordPhone && cleanPasswordPhone === storedPhoneClean) ||
        passwordInput === storedPhoneClean ||
        passwordInput === 'Admin@6789$';

      if (!isPasswordCorrect) {
        return NextResponse.json(
          {
            success: false,
            error: 'Incorrect password. Your login password is your registered 10-digit mobile number.',
          },
          { status: 401 }
        );
      }

      if (request.status === 'pending') {
        return NextResponse.json(
          {
            success: false,
            error: 'Your Admin Access Request is still PENDING approval from the Main Admin. Once approved, you can log in immediately.',
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
