import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { hashIp, hashUserAgent, hashString } from '@/lib/security/request-validation';
import { voteSchema } from '@/features/voting/schemas';

describe('Voting Engine & Rate Limiter', () => {
  it('allows requests within rate limits and blocks excess', () => {
    const key = `test_voter_${Date.now()}`;
    const limit = 3;
    const windowMs = 1000;

    // Hits 1, 2, 3 should succeed
    const hit1 = checkRateLimit({ key, limit, windowMs });
    expect(hit1.success).toBe(true);
    expect(hit1.remaining).toBe(2);

    const hit2 = checkRateLimit({ key, limit, windowMs });
    expect(hit2.success).toBe(true);
    expect(hit2.remaining).toBe(1);

    const hit3 = checkRateLimit({ key, limit, windowMs });
    expect(hit3.success).toBe(true);
    expect(hit3.remaining).toBe(0);

    // Hit 4 should be blocked
    const hit4 = checkRateLimit({ key, limit, windowMs });
    expect(hit4.success).toBe(false);
    expect(hit4.remaining).toBe(0);
  });

  it('generates consistent privacy-preserving hashes for IP and UA', () => {
    const ip = '103.21.244.1';
    const hash1 = hashIp(ip);
    const hash2 = hashIp(ip);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(ip);
    expect(hash1.length).toBe(64);

    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    const uaHash = hashUserAgent(ua);
    expect(uaHash.length).toBe(64);
  });

  it('rejects vote payloads with non-UUID values', () => {
    expect(voteSchema.safeParse({ contestId: '123', nominationId: '456' }).success).toBe(false);
    const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
    const validUuid2 = '987fcdeb-51a2-43d7-9012-345678901234';
    expect(voteSchema.safeParse({ contestId: validUuid1, nominationId: validUuid2 }).success).toBe(true);
  });
});
