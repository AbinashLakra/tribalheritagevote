/** Artist-related types */

export interface ArtistProfile {
  id: string;
  userId: string;
  stageName: string;
  fullName: string;
  bio: string;
  state: string;
  district: string;
  language: string;
  primaryCategory: string;
  experienceYears: number;
  socialLinks: {
    website?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
  };
  verificationStatus: "unverified" | "verified";
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistCardData {
  id: string;
  stageName: string;
  fullName: string;
  state: string;
  district: string;
  primaryCategory: string;
  avatarUrl?: string;
  nominationStatus?: string;
  videoThumbnailUrl?: string;
  slug: string;
}

export interface ArtistProfilePageData extends ArtistProfile {
  nominations: {
    id: string;
    contestId: string;
    title: string;
    status: string;
    voteCount: number;
    videoUrl?: string;
  }[];
}

