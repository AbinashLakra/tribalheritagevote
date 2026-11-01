-- Migration 013: Multi-Tier Admin Panels, 3-Strike Disqualification, and 8-Category Voter Ballot System

-- 1. Extend Admin Access Requests with Panel Assignment & Role Type
ALTER TABLE public.admin_access_requests 
ADD COLUMN IF NOT EXISTS role_type VARCHAR(30) NOT NULL DEFAULT 'panel_admin';

ALTER TABLE public.admin_access_requests 
ADD COLUMN IF NOT EXISTS assigned_panel INT DEFAULT 1;

ALTER TABLE public.admin_access_requests 
DROP CONSTRAINT IF EXISTS chk_admin_assigned_panel;

ALTER TABLE public.admin_access_requests 
ADD CONSTRAINT chk_admin_assigned_panel CHECK (assigned_panel IS NULL OR assigned_panel IN (1, 2, 3, 4));

-- 2. Extend Artist Profiles with Avatar, Contact and Verification state
ALTER TABLE public.artist_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

ALTER TABLE public.artist_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

ALTER TABLE public.artist_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;

ALTER TABLE public.artist_profiles 
ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Extend Nominations with 3-Strike Disqualification tracking
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS rejection_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Update Votes Table for 8 Mandatory Category Ballot (1 vote per category)
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.contest_categories(id) ON DELETE RESTRICT;

-- Populate existing votes' category_id from nominations if any exist
UPDATE public.votes v
SET category_id = n.category_id
FROM public.nominations n
WHERE v.nomination_id = n.id AND v.category_id IS NULL;

-- Replace old contest-wide 1-vote constraint with per-category constraint
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_contest_voter;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_contest_category_voter;

ALTER TABLE public.votes 
ADD CONSTRAINT uq_contest_category_voter UNIQUE (contest_id, category_id, voter_id);

CREATE INDEX IF NOT EXISTS idx_votes_category_id ON public.votes(category_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_contest ON public.votes(voter_id, contest_id);

-- 5. Updated Atomic Voting Function for 8-Category Ballot
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_contest_id UUID,
    p_nomination_id UUID,
    p_ip_hash VARCHAR,
    p_user_agent_hash VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_voter_id UUID;
    v_is_verified BOOLEAN;
    v_contest RECORD;
    v_nomination RECORD;
    v_category_id UUID;
    v_vote_id UUID;
    v_voted_count INT;
    v_voted_categories UUID[];
    v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
    -- 1. Identify the authenticated invoking user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: User must be authenticated to vote';
    END IF;

    -- 2. Fetch voter identity and verify mobile status
    SELECT id, is_verified INTO v_voter_id, v_is_verified
    FROM public.voter_identities
    WHERE user_id = v_user_id;

    IF v_voter_id IS NULL OR v_is_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'VERIFICATION_REQUIRED: Mobile number must be verified before voting';
    END IF;

    -- 3. Validate Contest state and dates
    SELECT id, status, voting_start_at, voting_end_at INTO v_contest
    FROM public.contests
    WHERE id = p_contest_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CONTEST_NOT_FOUND: Contest does not exist';
    END IF;

    IF v_contest.status <> 'open' THEN
        RAISE EXCEPTION 'CONTEST_NOT_OPEN: Voting is currently %', v_contest.status;
    END IF;

    IF v_now < v_contest.voting_start_at THEN
        RAISE EXCEPTION 'VOTING_NOT_STARTED: Voting opens at %', v_contest.voting_start_at;
    END IF;

    IF v_now > v_contest.voting_end_at THEN
        RAISE EXCEPTION 'VOTING_CLOSED: Voting closed at %', v_contest.voting_end_at;
    END IF;

    -- 4. Validate Nomination eligibility
    SELECT id, artist_profile_id, category_id, status, is_disqualified INTO v_nomination
    FROM public.nominations
    WHERE id = p_nomination_id AND contest_id = p_contest_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOMINATION_NOT_FOUND: Selected nomination does not exist in this contest';
    END IF;

    IF v_nomination.is_disqualified IS TRUE THEN
        RAISE EXCEPTION 'NOMINATION_DISQUALIFIED: This nomination has been disqualified and cannot receive votes.';
    END IF;

    IF v_nomination.status <> 'approved' THEN
        RAISE EXCEPTION 'NOMINATION_NOT_ELIGIBLE: Only approved nominations can receive votes';
    END IF;

    v_category_id := v_nomination.category_id;

    -- 5. Insert vote into votes table (guaranteed atomic per category)
    BEGIN
        INSERT INTO public.votes (
            contest_id,
            category_id,
            voter_id,
            nomination_id,
            artist_profile_id,
            ip_hash,
            user_agent_hash,
            server_timestamp
        ) VALUES (
            p_contest_id,
            v_category_id,
            v_voter_id,
            p_nomination_id,
            v_nomination.artist_profile_id,
            p_ip_hash,
            p_user_agent_hash,
            v_now
        ) RETURNING id INTO v_vote_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'DUPLICATE_CATEGORY_VOTE: You have already voted in this category. You may only cast one vote per award category.';
    END;

    -- 6. Atomically update materialized vote count on nominations table
    UPDATE public.nominations
    SET vote_count = vote_count + 1
    WHERE id = p_nomination_id;

    -- 7. Calculate remaining ballot progress
    SELECT count(*), array_agg(category_id)
    INTO v_voted_count, v_voted_categories
    FROM public.votes
    WHERE contest_id = p_contest_id AND voter_id = v_voter_id;

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'category_id', v_category_id,
        'voted_count', v_voted_count,
        'total_categories', 8,
        'all_completed', (v_voted_count >= 8),
        'voted_categories', v_voted_categories,
        'timestamp', v_now
    );
END;
$$;

-- 6. Helper function to check voter ballot progress
CREATE OR REPLACE FUNCTION public.get_voter_ballot_status(p_contest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_voter_id UUID;
    v_is_verified BOOLEAN;
    v_voted_count INT := 0;
    v_voted_categories UUID[] := ARRAY[]::UUID[];
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'is_verified', false,
            'voted_count', 0,
            'voted_categories', ARRAY[]::UUID[],
            'all_completed', false
        );
    END IF;

    SELECT id, is_verified INTO v_voter_id, v_is_verified
    FROM public.voter_identities
    WHERE user_id = v_user_id;

    IF v_voter_id IS NOT NULL THEN
        SELECT count(*), coalesce(array_agg(category_id), ARRAY[]::UUID[])
        INTO v_voted_count, v_voted_categories
        FROM public.votes
        WHERE contest_id = p_contest_id AND voter_id = v_voter_id;
    END IF;

    RETURN jsonb_build_object(
        'authenticated', true,
        'is_verified', coalesce(v_is_verified, false),
        'voted_count', v_voted_count,
        'voted_categories', coalesce(v_voted_categories, ARRAY[]::UUID[]),
        'all_completed', (v_voted_count >= 8)
    );
END;
$$;

