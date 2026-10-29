-- Migration 004: Persistent Artist Profiles and Contest Nominations
CREATE TABLE IF NOT EXISTS public.artist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    stage_name VARCHAR(150) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    bio TEXT NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    language VARCHAR(100) NOT NULL,
    primary_category VARCHAR(100) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_artist_profiles_user_id ON public.artist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_state ON public.artist_profiles(state);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_category ON public.artist_profiles(primary_category);

CREATE TRIGGER trg_artist_profiles_updated_at
    BEFORE UPDATE ON public.artist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Nominations submitted by artists for specific contests
CREATE TABLE IF NOT EXISTS public.nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE RESTRICT,
    artist_profile_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.contest_categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    upload_record_id UUID NULL, -- Foreign key added in migration 005
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'correction_required')),
    reviewer_notes TEXT NULL,
    rejection_reason TEXT NULL,
    vote_count BIGINT NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
    submitted_at TIMESTAMPTZ NULL,
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_contest_artist_nomination UNIQUE (contest_id, artist_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_nominations_contest_status ON public.nominations(contest_id, status);
CREATE INDEX IF NOT EXISTS idx_nominations_artist ON public.nominations(artist_profile_id);
CREATE INDEX IF NOT EXISTS idx_nominations_category ON public.nominations(category_id);
CREATE INDEX IF NOT EXISTS idx_nominations_leaderboard ON public.nominations(contest_id, status, vote_count DESC);

CREATE TRIGGER trg_nominations_updated_at
    BEFORE UPDATE ON public.nominations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
