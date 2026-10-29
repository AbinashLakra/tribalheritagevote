/** Leaderboard types */

export interface LeaderboardEntry {
  rank: number;
  nominationId: string;
  artistName: string;
  artistProfileId: string;
  avatarUrl?: string;
  state: string;
  category: string;
  voteCount: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalEntries: number;
  lastUpdated: string;
  contestTitle: string;
  contestStatus: string;
  isPublic: boolean;
}

export interface LeaderboardFilters {
  state?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

