/**
 * @file Contest, nomination, and upload state machines.
 * Defines all status enums, valid transitions, and transition-guard helpers.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Lifecycle status of a contest. */
export enum ContestStatus {
  Draft = 'draft',
  Scheduled = 'scheduled',
  Open = 'open',
  Paused = 'paused',
  Closed = 'closed',
  Finalized = 'finalized',
}

/** Lifecycle status of a nomination within a contest. */
export enum NominationStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  UnderReview = 'under_review',
  Approved = 'approved',
  Rejected = 'rejected',
  CorrectionRequired = 'correction_required',
}

/** Status of a media upload (video / image). */
export enum UploadStatus {
  Pending = 'pending',
  Uploaded = 'uploaded',
  Verified = 'verified',
  Failed = 'failed',
}

/** Controls when the public leaderboard is visible. */
export enum LeaderboardVisibility {
  Hidden = 'hidden',
  Live = 'live',
  Delayed = 'delayed',
}

// ---------------------------------------------------------------------------
// Transition maps
// ---------------------------------------------------------------------------

/**
 * Valid state transitions for {@link ContestStatus}.
 * Each key maps to the set of statuses the contest may move to.
 */
export const VALID_CONTEST_TRANSITIONS: Readonly<
  Record<ContestStatus, readonly ContestStatus[]>
> = {
  [ContestStatus.Draft]: [ContestStatus.Scheduled],
  [ContestStatus.Scheduled]: [ContestStatus.Open, ContestStatus.Draft],
  [ContestStatus.Open]: [ContestStatus.Paused, ContestStatus.Closed],
  [ContestStatus.Paused]: [ContestStatus.Open, ContestStatus.Closed],
  [ContestStatus.Closed]: [ContestStatus.Finalized, ContestStatus.Open],
  [ContestStatus.Finalized]: [],
} as const;

/**
 * Valid state transitions for {@link NominationStatus}.
 * Each key maps to the set of statuses the nomination may move to.
 */
export const VALID_NOMINATION_TRANSITIONS: Readonly<
  Record<NominationStatus, readonly NominationStatus[]>
> = {
  [NominationStatus.Draft]: [NominationStatus.Submitted],
  [NominationStatus.Submitted]: [NominationStatus.UnderReview],
  [NominationStatus.UnderReview]: [
    NominationStatus.Approved,
    NominationStatus.Rejected,
    NominationStatus.CorrectionRequired,
  ],
  [NominationStatus.Approved]: [],
  [NominationStatus.Rejected]: [],
  [NominationStatus.CorrectionRequired]: [NominationStatus.Submitted],
} as const;

// ---------------------------------------------------------------------------
// Transition guard helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether a contest may transition from one status to another.
 *
 * @param from - Current contest status
 * @param to   - Desired next contest status
 * @returns `true` if the transition is permitted
 *
 * @example
 * ```ts
 * canTransitionContest(ContestStatus.Open, ContestStatus.Paused); // true
 * canTransitionContest(ContestStatus.Finalized, ContestStatus.Open); // false
 * ```
 */
export function canTransitionContest(
  from: ContestStatus | `${ContestStatus}`,
  to: ContestStatus | `${ContestStatus}`,
): boolean {
  const allowed = VALID_CONTEST_TRANSITIONS[from as ContestStatus] ?? [];
  return (allowed as readonly string[]).includes(to);
}

/**
 * Checks whether a nomination may transition from one status to another.
 *
 * @param from - Current nomination status
 * @param to   - Desired next nomination status
 * @returns `true` if the transition is permitted
 *
 * @example
 * ```ts
 * canTransitionNomination(NominationStatus.UnderReview, NominationStatus.Approved); // true
 * canTransitionNomination(NominationStatus.Approved, NominationStatus.Draft); // false
 * ```
 */
export function canTransitionNomination(
  from: NominationStatus | `${NominationStatus}`,
  to: NominationStatus | `${NominationStatus}`,
): boolean {
  const allowed = VALID_NOMINATION_TRANSITIONS[from as NominationStatus] ?? [];
  return (allowed as readonly string[]).includes(to);
}
