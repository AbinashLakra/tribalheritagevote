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
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const { session, expired } = verifyAdminSession(token);
  if (!session || expired) {
    return null;
  }

  return session;
}
