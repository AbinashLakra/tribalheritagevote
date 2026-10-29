import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, hashPhoneNumber } from '@/features/auth/services/authUtils';

describe('Auth Utilities', () => {
  it('normalizes 10-digit Indian numbers to E.164 with +91', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
    expect(normalizePhoneNumber(' 98765 43210 ')).toBe('+919876543210');
  });

  it('preserves existing +91 numbers', () => {
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
  });

  it('normalizes 91 prefixed 12-digit numbers', () => {
    expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
  });

  it('generates consistent, deterministic SHA-256 phone hashes', () => {
    const hash1 = hashPhoneNumber('9876543210');
    const hash2 = hashPhoneNumber('+91 98765 43210');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });
});
