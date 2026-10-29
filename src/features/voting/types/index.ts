/** Voting-related types */

export interface VoteReceipt {
  voteId: string;
  contestId: string;
  nominationId: string;
  timestamp: string;
  success: boolean;
}

export interface VoterStatus {
  isAuthenticated: boolean;
  isVerified: boolean;
  hasVoted: boolean;
  votedNominationId?: string;
  votedAt?: string;
}

export interface VotingEligibility {
  canVote: boolean;
  reason?: string;
  contestStatus: string;
  isVotingOpen: boolean;
  votingStartsAt?: string;
  votingEndsAt?: string;
}

export interface ContestVotingState {
  contestId: string;
  status: string;
  isVotingOpen: boolean;
  votingStartAt: string;
  votingEndAt: string;
  totalVotes: number;
  totalNominations: number;
}

