import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ARTIST_COOKIE_NAME = 'artist_session_token';
export const ARTIST_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

export interface ArtistSessionPayload {
  artistProfileId: string;
  userId: string;
  stageName: string;
  fullName: string;
  phone: string;
  email: string;
  loginAt: number;
}

const DEFAULT_SECRET = 'adivasi_tribal_artist_session_secret_2026';

function getSecretKey(): string {
  return process.env.ARTIST_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}

/**
 * Creates a signed, base64-encoded token for the artist session.
 */
export function signArtistSession(payload: ArtistSessionPayload): string {
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
 * Verifies the signature of an artist session token.
 */
export function verifyArtistSession(token: string): ArtistSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [base64Payload, signature] = parts;
    const secret = getSecretKey();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(base64Payload)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const json = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const session = JSON.parse(json) as ArtistSessionPayload;
    return session;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current artist session from cookies in Server Components or Route Handlers.
 */
export async function getArtistSession(): Promise<ArtistSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ARTIST_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifyArtistSession(token);
}

/**
 * Computes a deterministic password hash for backup verification.
 */
export function hashArtistPassword(password: string, salt: string = 'adivasi_2026'): string {
  return crypto.createHash('sha256').update(`${salt}:${password.trim()}:${salt}`).digest('hex');
}

