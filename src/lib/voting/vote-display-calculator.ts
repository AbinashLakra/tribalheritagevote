/**
 * Organic Vote Display Calculator (Display Layer)
 * 
 * Secure presentation-layer algorithm that generates a natural, non-round,
 * realistic voting curve while preserving 100% database integrity of real citizen votes.
 * 
 * Rules:
 * 1. Database votes table remains pure, immutable, and cryptographic. Real votes determine official winners.
 * 2. Target: ~1,000 baseline votes added per 24 hours per contestant (~41.67 votes/hr).
 * 3. Voting timeline: 12 Nov 2026 13:00 IST (07:30 UTC) to 15 Nov 2026 12:00 IST (06:30 UTC).
 * 4. Contestant hierarchy: Real votes provide natural momentum; candidates leading in real votes scale proportionally higher.
 * 5. Strictly non-round numbers (no ending in 0 or 50; natural odd/even digits like 894, 763, 1147).
 * 6. Deterministic per candidate & 5-minute time bucket: No jitter or backwards jumps on refresh.
 * 7. Reopening bonus: +500 votes if contest is reopened after 15 Nov 12:00 PM.
 */

export interface ContestSettings {
  show_public_votes: boolean;
  boost_enabled: boolean;
  boost_velocity_per_day: number;
}

export const DEFAULT_CONTEST_SETTINGS: ContestSettings = {
  show_public_votes: true,
  boost_enabled: true,
  boost_velocity_per_day: 1000,
};

export const CONTEST_OFFICIAL_TIMELINE = {
  startAt: '2026-11-12T07:30:00.000Z', // 12 Nov 2026 1:00 PM IST
  endAt: '2026-11-15T06:30:00.000Z',   // 15 Nov 2026 12:00 PM IST
  totalHours: 71,
};

/**
 * Fast deterministic string hash
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface CalculateBoostParams {
  nominationId: string;
  realVotes: number;
  maxRealVotes?: number;
  startAt?: string | Date;
  endAt?: string | Date;
  currentTime?: Date | string;
  boostEnabled?: boolean;
  targetPer24h?: number;
  isReopened?: boolean;
}

export interface BoostCalculationResult {
  realVotes: number;
  syntheticBoost: number;
  displayedVotes: number;
}

/**
 * Calculates displayed vote count for a single nomination
 */
export function calculateDisplayedVoteCount(params: CalculateBoostParams): BoostCalculationResult {
  const {
    nominationId,
    realVotes,
    maxRealVotes = Math.max(50, realVotes),
    startAt = CONTEST_OFFICIAL_TIMELINE.startAt,
    endAt = CONTEST_OFFICIAL_TIMELINE.endAt,
    currentTime = new Date(),
    boostEnabled = true,
    targetPer24h = 1000,
    isReopened = false,
  } = params;

  // If boost is disabled by Main Admin, return raw real votes
  if (!boostEnabled) {
    return {
      realVotes,
      syntheticBoost: 0,
      displayedVotes: realVotes,
    };
  }

  const startTime = new Date(startAt).getTime();
  const endTime = new Date(endAt).getTime();
  const now = new Date(currentTime).getTime();

  // If voting hasn't opened yet
  if (now < startTime) {
    return {
      realVotes,
      syntheticBoost: 0,
      displayedVotes: realVotes,
    };
  }

  // Calculate elapsed time (cap at contest end unless officially reopened)
  const effectiveNow = (!isReopened && now > endTime) ? endTime : now;
  // Quantize time to 5-minute bucket so calculation is 100% deterministic on reloads
  const bucketSizeMs = 5 * 60 * 1000;
  const bucketTime = Math.floor(effectiveNow / bucketSizeMs) * bucketSizeMs;
  const elapsedMs = Math.max(0, bucketTime - startTime);
  const elapsedHours = elapsedMs / (3600 * 1000);

  // Deterministic seed for this candidate
  const seed = hashString(nominationId);

  // Candidate pace variance: +/- 5% natural difference so candidates don't progress identically
  const paceVariance = 0.95 + ((seed % 100) / 1000); // 0.95 to 1.05

  // Real vote proportion relative to benchmark leader
  const benchmark = Math.max(50, maxRealVotes);
  const ratio = Math.min(1.25, Math.max(0, realVotes / benchmark));

  // Base daily target: scales from ~220 up to ~targetPer24h based on real vote momentum
  // This guarantees:
  // 1. Contestants with high real votes scale to ~1,000 + real votes per 24 hours
  // 2. Contestants with lower real votes scale proportionally lower in a realistic decreasing curve
  // 3. Any sudden influx of real votes dynamically boosts their rate immediately
  const baseFloor = targetPer24h * 0.22;
  const dynamicSpan = targetPer24h * 0.82;
  const dailyTarget = (baseFloor + (dynamicSpan * ratio)) * paceVariance;

  const hourlyRate = dailyTarget / 24;
  let boost = elapsedHours * hourlyRate;

  // Reopening extension bonus: if contest is reopened after 15 Nov, add ~500 votes scaled with momentum
  if (isReopened) {
    const reopenTarget = 500 * (0.5 + 0.5 * ratio) * paceVariance;
    boost += reopenTarget;
  }

  // 5-minute time bucket ensures stability on page reloads within the same 5-minute interval
  const bucket = Math.floor(now / (5 * 60 * 1000));
  const timeSeed = hashString(`${nominationId}_${bucket}`);
  const jitter = (timeSeed % 7) - 3; // -3 to +3 small organic jitter

  let displayed = Math.round(realVotes + boost + jitter);
  if (displayed < realVotes) {
    displayed = realVotes;
  }

  // CRITICAL REQUIREMENT: Strictly remove round endings (no ending in 0 or 50)
  // Voters and artists must always see realistic natural numbers like 894, 763, 1147
  if (displayed % 10 === 0) {
    const nudge = (seed % 7) + 1; // 1 to 7
    displayed += (seed % 2 === 0 ? nudge : -nudge);
  }
  if (displayed % 100 === 50) {
    displayed += (seed % 2 === 0 ? 3 : -3);
  }

  // Displayed votes can never drop below actual real votes
  if (displayed < realVotes) {
    displayed = realVotes;
  }

  const syntheticBoost = displayed - realVotes;

  return {
    realVotes,
    syntheticBoost,
    displayedVotes: displayed,
  };
}

/**
 * Extract ContestSettings from contest record safely
 */
export function extractContestSettings(contest: Record<string, any> | null | undefined): ContestSettings {
  if (!contest) return DEFAULT_CONTEST_SETTINGS;

  const rawSettings = contest.settings || {};
  return {
    show_public_votes:
      typeof rawSettings.show_public_votes === 'boolean'
        ? rawSettings.show_public_votes
        : contest.leaderboard_visibility !== 'hidden',
    boost_enabled:
      typeof rawSettings.boost_enabled === 'boolean'
        ? rawSettings.boost_enabled
        : true,
    boost_velocity_per_day:
      typeof rawSettings.boost_velocity_per_day === 'number'
        ? rawSettings.boost_velocity_per_day
        : 1000,
  };
}

/**
 * Enhances an array of nominations with calculated display vote counts
 */
export function enhanceNominationsWithBoost<T extends { id: string; vote_count: number }>(
  nominations: T[],
  contest: Record<string, any> | null | undefined,
  currentTime: Date = new Date()
): (T & { real_vote_count: number; synthetic_boost: number; displayed_vote_count: number })[] {
  const settings = extractContestSettings(contest);
  const maxReal = nominations.reduce((max, n) => Math.max(max, n.vote_count || 0), 0);
  const isReopened = Boolean(contest?.reopening_reason && contest?.status === 'open');

  return nominations.map((nom) => {
    const calc = calculateDisplayedVoteCount({
      nominationId: nom.id,
      realVotes: nom.vote_count || 0,
      maxRealVotes: maxReal,
      startAt: contest?.voting_start_at || CONTEST_OFFICIAL_TIMELINE.startAt,
      endAt: contest?.voting_end_at || CONTEST_OFFICIAL_TIMELINE.endAt,
      currentTime,
      boostEnabled: settings.boost_enabled,
      targetPer24h: settings.boost_velocity_per_day,
      isReopened,
    });

    return {
      ...nom,
      real_vote_count: calc.realVotes,
      synthetic_boost: calc.syntheticBoost,
      displayed_vote_count: calc.displayedVotes,
      // If public votes are enabled, replace vote_count with displayedVotes
      vote_count: calc.displayedVotes,
    };
  });
}
