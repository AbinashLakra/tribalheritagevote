/**
 * Auto-generated database types placeholder.
 * In production, generate this file using:
 *   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 *
 * This placeholder defines the expected shape for development.
 * It will be replaced by the Supabase CLI-generated version.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "voter" | "artist" | "reviewer" | "admin" | "super_admin";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "voter" | "artist" | "reviewer" | "admin" | "super_admin";
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: "voter" | "artist" | "reviewer" | "admin" | "super_admin";
        };
      };
      contests: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          timezone: string;
          nomination_start_at: string;
          nomination_end_at: string;
          voting_start_at: string;
          voting_end_at: string;
          status: "draft" | "scheduled" | "open" | "paused" | "closed" | "finalized";
          leaderboard_visibility: "hidden" | "live" | "delayed";
          results_published: boolean;
          reopening_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          timezone?: string;
          nomination_start_at: string;
          nomination_end_at: string;
          voting_start_at: string;
          voting_end_at: string;
          status?: "draft" | "scheduled" | "open" | "paused" | "closed" | "finalized";
          leaderboard_visibility?: "hidden" | "live" | "delayed";
          results_published?: boolean;
          reopening_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          timezone?: string;
          nomination_start_at?: string;
          nomination_end_at?: string;
          voting_start_at?: string;
          voting_end_at?: string;
          status?: "draft" | "scheduled" | "open" | "paused" | "closed" | "finalized";
          leaderboard_visibility?: "hidden" | "live" | "delayed";
          results_published?: boolean;
          reopening_reason?: string | null;
          updated_at?: string;
        };
      };
      artist_profiles: {
        Row: {
          id: string;
          user_id: string;
          stage_name: string;
          full_name: string;
          bio: string;
          state: string;
          district: string;
          language: string;
          primary_category: string;
          experience_years: number;
          social_links: Json;
          verification_status: "unverified" | "verified";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stage_name: string;
          full_name: string;
          bio: string;
          state: string;
          district: string;
          language: string;
          primary_category: string;
          experience_years?: number;
          social_links?: Json;
          verification_status?: "unverified" | "verified";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stage_name?: string;
          full_name?: string;
          bio?: string;
          state?: string;
          district?: string;
          language?: string;
          primary_category?: string;
          experience_years?: number;
          social_links?: Json;
          verification_status?: "unverified" | "verified";
          updated_at?: string;
        };
      };
      nominations: {
        Row: {
          id: string;
          contest_id: string;
          artist_profile_id: string;
          category_id: string;
          title: string;
          description: string;
          upload_record_id: string | null;
          status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "correction_required";
          reviewer_notes: string | null;
          rejection_reason: string | null;
          vote_count: number;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          artist_profile_id: string;
          category_id: string;
          title: string;
          description: string;
          upload_record_id?: string | null;
          status?: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "correction_required";
          reviewer_notes?: string | null;
          rejection_reason?: string | null;
          vote_count?: number;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          upload_record_id?: string | null;
          status?: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "correction_required";
          reviewer_notes?: string | null;
          rejection_reason?: string | null;
          vote_count?: number;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
      };
      upload_records: {
        Row: {
          id: string;
          user_id: string;
          object_key: string;
          original_filename: string;
          file_size_bytes: number;
          mime_type: string;
          upload_status: "pending" | "uploaded" | "verified" | "failed";
          public_url: string | null;
          checksum_sha256: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          object_key: string;
          original_filename: string;
          file_size_bytes: number;
          mime_type: string;
          upload_status?: "pending" | "uploaded" | "verified" | "failed";
          public_url?: string | null;
          checksum_sha256?: string | null;
          created_at?: string;
        };
        Update: {
          upload_status?: "pending" | "uploaded" | "verified" | "failed";
          public_url?: string | null;
          checksum_sha256?: string | null;
        };
      };
      voter_identities: {
        Row: {
          id: string;
          user_id: string;
          phone_hash: string;
          phone_country_code: string;
          is_verified: boolean;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone_hash: string;
          phone_country_code?: string;
          is_verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          phone_hash?: string;
          is_verified?: boolean;
          verified_at?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          contest_id: string;
          voter_id: string;
          nomination_id: string;
          artist_profile_id: string;
          ip_hash: string;
          user_agent_hash: string;
          server_timestamp: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          voter_id: string;
          nomination_id: string;
          artist_profile_id: string;
          ip_hash: string;
          user_agent_hash: string;
          server_timestamp?: string;
        };
        Update: Record<string, never>;
      };
      contest_events: {
        Row: {
          id: string;
          contest_id: string;
          event_type: string;
          previous_state: string | null;
          new_state: string;
          actor_id: string;
          reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          event_type: string;
          previous_state?: string | null;
          new_state: string;
          actor_id: string;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      result_snapshots: {
        Row: {
          id: string;
          contest_id: string;
          snapshot_data: Json;
          total_votes: number;
          finalized_by: string;
          published_at: string;
          checksum_sha256: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          snapshot_data: Json;
          total_votes: number;
          finalized_by: string;
          published_at?: string;
          checksum_sha256: string;
        };
        Update: Record<string, never>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_entity: string;
          target_id: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_entity: string;
          target_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      security_events: {
        Row: {
          id: string;
          event_type: string;
          identifier: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          identifier: string;
          details?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      contest_categories: {
        Row: {
          id: string;
          contest_id: string;
          slug: string;
          name: string;
          description: string | null;
          display_order: number;
        };
        Insert: {
          id?: string;
          contest_id: string;
          slug: string;
          name: string;
          description?: string | null;
          display_order?: number;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
        };
      };
    };
    Functions: {
      cast_vote: {
        Args: {
          p_contest_id: string;
          p_nomination_id: string;
          p_ip_hash: string;
          p_user_agent_hash: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
}

