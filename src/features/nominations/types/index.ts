/** Nomination-related types */

export type NominationStatusType =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "correction_required";

export interface Nomination {
  id: string;
  contestId: string;
  artistProfileId: string;
  categoryId: string;
  title: string;
  description: string;
  uploadRecordId: string | null;
  status: NominationStatusType;
  reviewerNotes: string | null;
  rejectionReason: string | null;
  voteCount: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NominationWithArtist extends Nomination {
  artistProfile: {
    id: string;
    stageName: string;
    fullName: string;
    state: string;
    district: string;
    primaryCategory: string;
    avatarUrl?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  uploadRecord?: {
    id: string;
    objectKey: string;
    publicUrl: string | null;
    mimeType: string;
  };
}

export interface NominationModerationItem extends NominationWithArtist {
  /** Number of items in moderation queue */
  queuePosition?: number;
}

