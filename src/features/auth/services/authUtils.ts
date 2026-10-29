import { hashString } from '@/lib/security/request-validation';

/**
 * Normalizes an Indian phone number to standard E.164 format (+91XXXXXXXXXX).
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+${digits}`;
}

/**
 * Generates privacy-preserving SHA-256 hash of the normalized phone number.
 */
export function hashPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return hashString(normalized, 'voter_phone_salt');
}
