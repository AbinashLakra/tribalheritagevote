# Database Schema & Data Dictionary

All database tables and constraints are version-controlled under `supabase/migrations/` (001 through 010).

## 1. Schema Diagram

```text
profiles (extends auth.users)
  ├── user_roles (voter, artist, reviewer, admin, super_admin)
  ├── artist_profiles (persistent profile across contests)
  └── voter_identities (HMAC phone_hash, is_verified)

contests (seasonal editions)
  ├── contest_categories (dance, music, painting, crafts)
  ├── nominations (contest-specific submissions)
  │     └── upload_records (Cloudflare R2 media metadata)
  ├── votes (enforced UNIQUE(contest_id, voter_id))
  ├── contest_events (lifecycle state transitions)
  └── result_snapshots (immutable finalized tally)

audit_logs & security_events (security incident & rate-limit monitoring)
```

## 2. Table Specifications

### `profiles`
- Primary user table linked directly to Supabase Auth `auth.users`.
- Fields: `id` (UUID PK), `phone` (private), `full_name`, `avatar_url`, timestamps.

### `user_roles`
- Granular Role-Based Access Control (RBAC).
- Decoupled from user profile to eliminate client-side privilege escalation.
- Roles: `voter`, `artist`, `reviewer`, `admin`, `super_admin`.

### `contests`
- Supports multiple annual/seasonal contests over time.
- Timezone-aware (default `Asia/Kolkata`).
- Statuses: `draft`, `scheduled`, `open`, `paused`, `closed`, `finalized`.

### `artist_profiles`
- Decoupled from contest nominations so artists retain their public lineage across future editions.
- Stores: `stage_name`, `full_name`, `bio`, `state`, `district`, `language`, `experience_years`.

### `nominations`
- Specific entry submitted by an artist for a given contest edition.
- Unique constraint: `UNIQUE (contest_id, artist_profile_id)`.
- Statuses: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `correction_required`.

### `votes`
- Append-only ballot registry.
- Unique constraint: `CONSTRAINT uq_contest_voter UNIQUE (contest_id, voter_id)`.
- Write access: Strictly restricted to the `cast_vote` PostgreSQL RPC (`SECURITY DEFINER`). Zero public INSERT grants.

