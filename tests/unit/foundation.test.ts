import { describe, it, expect } from 'vitest';
import { phoneSchema, otpSchema } from '@/features/auth/schemas';
import { artistProfileSchema } from '@/features/artists/schemas';
import { voteSchema } from '@/features/voting/schemas';
import { canTransitionContest, canTransitionNomination } from '@/lib/constants/contest-states';
import { formatIndianNumber, formatPhoneDisplay } from '@/lib/utils/formatters';

describe('Validation Schemas', () => {
  it('validates correct Indian phone numbers', () => {
    expect(phoneSchema.safeParse('+919876543210').success).toBe(true);
    expect(phoneSchema.safeParse('9876543210').success).toBe(true);
    expect(phoneSchema.safeParse('12345').success).toBe(false);
  });

  it('validates 6-digit numeric OTP', () => {
    expect(otpSchema.safeParse({ phone: '+919876543210', token: '123456' }).success).toBe(true);
    expect(otpSchema.safeParse({ phone: '+919876543210', token: '12345' }).success).toBe(false);
    expect(otpSchema.safeParse({ phone: '+919876543210', token: 'abcdef' }).success).toBe(false);
  });

  it('validates UUID for voting input', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(voteSchema.safeParse({ contestId: validUuid, nominationId: validUuid }).success).toBe(true);
    expect(voteSchema.safeParse({ contestId: 'invalid-id', nominationId: validUuid }).success).toBe(false);
  });
});

describe('Contest Lifecycle Transitions', () => {
  it('allows valid contest state transitions', () => {
    expect(canTransitionContest('draft', 'scheduled')).toBe(true);
    expect(canTransitionContest('scheduled', 'open')).toBe(true);
    expect(canTransitionContest('open', 'paused')).toBe(true);
    expect(canTransitionContest('paused', 'open')).toBe(true);
    expect(canTransitionContest('open', 'closed')).toBe(true);
    expect(canTransitionContest('closed', 'finalized')).toBe(true);
    expect(canTransitionContest('closed', 'open')).toBe(true); // Reopening
  });

  it('blocks invalid contest transitions', () => {
    expect(canTransitionContest('draft', 'open')).toBe(false);
    expect(canTransitionContest('finalized', 'open')).toBe(false);
    expect(canTransitionContest('finalized', 'draft')).toBe(false);
  });

  it('enforces nomination state transitions', () => {
    expect(canTransitionNomination('draft', 'submitted')).toBe(true);
    expect(canTransitionNomination('submitted', 'under_review')).toBe(true);
    expect(canTransitionNomination('under_review', 'approved')).toBe(true);
    expect(canTransitionNomination('under_review', 'rejected')).toBe(true);
    expect(canTransitionNomination('approved', 'draft')).toBe(false);
  });
});

describe('Formatting Utilities', () => {
  it('formats numbers into Indian numbering format', () => {
    expect(formatIndianNumber(1000)).toBe('1,000');
    expect(formatIndianNumber(100000)).toBe('1,00,000');
    expect(formatIndianNumber(10000000)).toBe('1,00,00,000');
  });

  it('masks phone numbers for voter privacy', () => {
    expect(formatPhoneDisplay('+919876543210')).toBe('+91 98***43210');
  });
});
