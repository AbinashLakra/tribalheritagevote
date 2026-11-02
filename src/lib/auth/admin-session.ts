import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  INACTIVITY_TIMEOUT_MS,
  AdminPermissions,
  AdminSessionPayload,
  SUPER_ADMIN_PERMISSIONS,
} from './admin-constants';
import { createAdminClient } from '@/lib/supabase/admin';

export * from './admin-constants';

const DEFAULT_SECRET = 'adivasi_tribal_admin_session_key_2026';

function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.CRON_SECRET || DEFAULT_SECRET;
}

/**
 * Creates a signed, base64-encoded token for the admin session.
 */
export function signAdminSession(payload: AdminSessionPayload): string {
  const secret = getSecretKey();
  const serialized = JSON.stringify(payload);
  const base64Payload = Buffer.from(serialized, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies the signature and checks inactivity expiration (15 minutes).
 */
export function verifyAdminSession(token: string): { session: AdminSessionPayload | null; expired: boolean } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { session: null, expired: false };
    }

    const [base64Payload, signature] = parts;
    const secret = getSecretKey();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(base64Payload)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { session: null, expired: false };
    }

    const json = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const session = JSON.parse(json) as AdminSessionPayload;

    // Check inactivity timeout (15 minutes)
    const now = Date.now();
    if (now - session.lastActive > INACTIVITY_TIMEOUT_MS) {
      return { session: null, expired: true };
    }

    return { session, expired: false };
  } catch {
    return { session: null, expired: false };
  }
}

/**
 * Reads and validates the current admin session from incoming cookies.
 * For Delegated Sub-Admins, it verifies active approval status against Supabase
 * in real-time and dynamically reflects shifted permissions set by the Super Admin.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const { session, expired } = verifyAdminSession(token);
  if (!session || expired) {
    return null;
  }

  // Super Admin maintains master privileges directly
  if (session.role === 'super_admin') {
    return session;
  }

  // Delegated Sub-Admin / Co-Admin / Panel Admin: Real-time dynamic sync with admin_access_requests
  if (session.adminId || session.phone || session.email) {
    try {
      const admin = createAdminClient();
      let query = admin.from('admin_access_requests').select('status, permissions, role_type, assigned_panel');

      if (session.adminId) {
        query = query.eq('id', session.adminId);
      } else if (session.email) {
        query = query.eq('email', session.email);
      } else if (session.phone) {
        query = query.eq('phone', session.phone);
      }

      const { data: record, error } = await query.maybeSingle();

      if (error || !record) {
        return session; // fallback to session if db query error
      }

      // If Main Admin has revoked or rejected this sub-admin, lock them out immediately!
      if (record.status !== 'approved') {
        return null;
      }

      if (record.role_type === 'co_admin') {
        session.role = 'co_admin';
        session.assignedPanel = null;
        session.permissions = {
          can_moderate_videos: true,
          can_manage_contest: true,
          can_view_audit_logs: true,
          can_export_data: true,
          can_view_analytics: true,
          can_manage_admins: true, // Second Main Admin has full access to supervise and shift panel admins
          ...(typeof record.permissions === 'object' ? record.permissions : {}),
        };
      } else {
        if (record.role_type) {
          session.role = record.role_type as any;
        }
        if (record.assigned_panel !== undefined) {
          session.assignedPanel = record.assigned_panel as any;
        }

        // Dynamically reflect any shifted permissions updated by Main Super Admin
        if (record.permissions && typeof record.permissions === 'object') {
          session.permissions = {
            can_moderate_videos: Boolean(record.permissions.can_moderate_videos),
            can_manage_contest: Boolean(record.permissions.can_manage_contest),
            can_view_audit_logs: Boolean(record.permissions.can_view_audit_logs),
            can_export_data: Boolean(record.permissions.can_export_data),
            can_view_analytics: Boolean(record.permissions.can_view_analytics ?? true),
            can_manage_admins: Boolean(record.permissions.can_manage_admins),
          };
        }
      }
    } catch {
      // Graceful fallback on network glitch
    }
  }

  return session;
}
