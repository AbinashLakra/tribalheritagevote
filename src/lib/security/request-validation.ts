import { NextRequest } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { createHash } from 'crypto';

/**
 * Validates a JSON request body against a given Zod schema.
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[]> }
> {
  try {
    const json = await request.json();
    const result = schema.safeParse(json);

    if (!result.success) {
      const flattened = (result.error as ZodError).flatten();
      const firstError = Object.values(flattened.fieldErrors).flat()[0];
      return {
        success: false,
        error: typeof firstError === 'string' ? firstError : 'Invalid request body',
        details: flattened.fieldErrors as Record<string, string[]>,
      };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: 'Malformed JSON payload' };
  }
}

/**
 * Extracts the client's public IP address from proxy headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Generates a SHA-256 hash of a string with a platform salt.
 */
export function hashString(value: string, salt: string = 'tribal_heritage_salt'): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

/**
 * Privacy-preserving IP hash for duplicate-vote fraud detection.
 */
export function hashIp(ip: string): string {
  return hashString(ip, 'voter_ip');
}

/**
 * Fingerprint hash for client user agent.
 */
export function hashUserAgent(userAgent: string): string {
  return hashString(userAgent, 'voter_ua');
}
