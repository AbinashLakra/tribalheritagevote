/** Admin-related types */

export interface DashboardStats {
  totalNominations: number;
  approvedNominations: number;
  rejectedNominations: number;
  pendingNominations: number;
  totalVerifiedVoters: number;
  totalAcceptedVotes: number;
  duplicateVoteAttempts: number;
  totalStorageUsedMb: number;
}

export interface VotingTrend {
  timestamp: string;
  voteCount: number;
}

export interface StateWiseStats {
  state: string;
  nominations: number;
  votes: number;
}

export interface CategoryWiseStats {
  category: string;
  nominations: number;
  votes: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName?: string;
  action: string;
  targetEntity: string;
  targetId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface ContestManagementData {
  id: string;
  title: string;
  slug: string;
  status: string;
  nominationStartAt: string;
  nominationEndAt: string;
  votingStartAt: string;
  votingEndAt: string;
  leaderboardVisibility: string;
  resultsPublished: boolean;
  totalNominations: number;
  totalVotes: number;
}

