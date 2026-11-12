import { describe, it, expect } from 'vitest';
import {
  calculateDisplayedVoteCount,
  extractContestSettings,
  enhanceNominationsWithBoost,
  CONTEST_OFFICIAL_TIMELINE,
} from '../vote-display-calculator';

describe('Vote Display Calculator (Organic Display Boost)', () => {
  const sampleNominationId = '9fbb0765-6a64-4907-bdd8-71a861e201e5';
  const startAt = CONTEST_OFFICIAL_TIMELINE.startAt; // 12 Nov 2026 13:00 IST
  const endAt = CONTEST_OFFICIAL_TIMELINE.endAt;     // 15 Nov 2026 12:00 IST

  it('preserves raw votes when boost is disabled', () => {
    const res = calculateDisplayedVoteCount({
      nominationId: sampleNominationId,
      realVotes: 42,
      boostEnabled: false,
    });

    expect(res.realVotes).toBe(42);
    expect(res.syntheticBoost).toBe(0);
    expect(res.displayedVotes).toBe(42);
  });

  it('returns raw votes before contest start time', () => {
    const beforeStart = new Date('2026-11-12T06:00:00Z');
    const res = calculateDisplayedVoteCount({
      nominationId: sampleNominationId,
      realVotes: 25,
      startAt,
      endAt,
      currentTime: beforeStart,
    });

    expect(res.realVotes).toBe(25);
    expect(res.syntheticBoost).toBe(0);
    expect(res.displayedVotes).toBe(25);
  });

  it('never outputs round numbers ending in 0 or 50', () => {
    // Test across 50 different time intervals and nomination IDs
    for (let hour = 1; hour <= 71; hour += 2) {
      const currentTime = new Date(new Date(startAt).getTime() + hour * 3600 * 1000);
      const res = calculateDisplayedVoteCount({
        nominationId: `test-nom-${hour}`,
        realVotes: 15,
        maxRealVotes: 60,
        startAt,
        endAt,
        currentTime,
      });

      expect(res.displayedVotes % 10).not.toBe(0);
      expect(res.displayedVotes % 100).not.toBe(50);
      expect(res.displayedVotes).toBeGreaterThanOrEqual(15);
    }
  });

  it('produces ~1000 votes after 24 hours for leading candidates', () => {
    const twentyFourHoursAfter = new Date(new Date(startAt).getTime() + 24 * 3600 * 1000);
    const res = calculateDisplayedVoteCount({
      nominationId: sampleNominationId,
      realVotes: 65,
      maxRealVotes: 65,
      startAt,
      endAt,
      currentTime: twentyFourHoursAfter,
      targetPer24h: 1000,
    });

    // Should be in the ~1000 to ~1100 range (+ real votes), non-round
    expect(res.displayedVotes).toBeGreaterThanOrEqual(950);
    expect(res.displayedVotes).toBeLessThanOrEqual(1150);
    expect(res.displayedVotes % 10).not.toBe(0);
  });

  it('scales lower real vote candidates in decreasing proportion', () => {
    const twentyFourHoursAfter = new Date(new Date(startAt).getTime() + 24 * 3600 * 1000);
    
    const topCandidate = calculateDisplayedVoteCount({
      nominationId: 'nom-top',
      realVotes: 65,
      maxRealVotes: 65,
      currentTime: twentyFourHoursAfter,
    });

    const midCandidate = calculateDisplayedVoteCount({
      nominationId: 'nom-mid',
      realVotes: 18,
      maxRealVotes: 65,
      currentTime: twentyFourHoursAfter,
    });

    const lowCandidate = calculateDisplayedVoteCount({
      nominationId: 'nom-low',
      realVotes: 2,
      maxRealVotes: 65,
      currentTime: twentyFourHoursAfter,
    });

    expect(topCandidate.displayedVotes).toBeGreaterThan(midCandidate.displayedVotes);
    expect(midCandidate.displayedVotes).toBeGreaterThan(lowCandidate.displayedVotes);
  });

  it('is deterministic within the same 5-minute bucket', () => {
    const t1 = new Date('2026-11-13T02:11:15Z');
    const t2 = new Date('2026-11-13T02:11:45Z'); // same 5-min bucket

    const r1 = calculateDisplayedVoteCount({
      nominationId: sampleNominationId,
      realVotes: 30,
      currentTime: t1,
    });

    const r2 = calculateDisplayedVoteCount({
      nominationId: sampleNominationId,
      realVotes: 30,
      currentTime: t2,
    });

    expect(r1.displayedVotes).toBe(r2.displayedVotes);
    expect(r1.syntheticBoost).toBe(r2.syntheticBoost);
  });

  it('correctly enhances an array of nominations', () => {
    const nominations = [
      { id: 'nom-1', vote_count: 65, title: 'Leading Song' },
      { id: 'nom-2', vote_count: 10, title: 'Emerging Song' },
    ];

    const contest = {
      voting_start_at: startAt,
      voting_end_at: endAt,
      settings: { show_public_votes: true, boost_enabled: true, boost_velocity_per_day: 1000 },
    };

    const enhanced = enhanceNominationsWithBoost(nominations, contest, new Date('2026-11-13T07:30:00Z'));
    expect(enhanced.length).toBe(2);
    expect(enhanced[0].real_vote_count).toBe(65);
    expect(enhanced[0].displayed_vote_count).toBeGreaterThan(65);
    expect(enhanced[0].displayed_vote_count).toBe(enhanced[0].vote_count);
    expect(enhanced[1].real_vote_count).toBe(10);
    expect(enhanced[1].displayed_vote_count).toBeGreaterThan(10);
  });
});

