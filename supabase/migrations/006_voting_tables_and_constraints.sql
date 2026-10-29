-- Migration 006: Voter Identities and Votes Table with Guaranteed Unique Constraints

-- Dedicated internal voter identity decoupled from raw phone numbers
CREATE TABLE IF NOT EXISTS public.voter_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    phone_hash VARCHAR(64) NOT NULL UNIQUE,
    phone_country_code VARCHAR(5) NOT NULL DEFAULT '+91',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_voter_identities_user_id ON public.voter_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_voter_identities_phone_hash ON public.voter_identities(phone_hash);

-- Immutable, append-only votes table
-- The foundational constraint: UNIQUE (contest_id, voter_id) enforces ONE VOTE PER CONTEST
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE RESTRICT,
    voter_id UUID NOT NULL REFERENCES public.voter_identities(id) ON DELETE RESTRICT,
    nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE RESTRICT,
    artist_profile_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE RESTRICT,
    ip_hash VARCHAR(64) NOT NULL,
    user_agent_hash VARCHAR(64) NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_contest_voter UNIQUE (contest_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_contest_nomination ON public.votes(contest_id, nomination_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON public.votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_contest_artist ON public.votes(contest_id, artist_profile_id);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON public.votes(server_timestamp);

-- Contest state transition history and lifecycle events
CREATE TABLE IF NOT EXISTS public.contest_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    previous_state VARCHAR(20) NULL,
    new_state VARCHAR(20) NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    reason TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_contest_events_contest ON public.contest_events(contest_id);
