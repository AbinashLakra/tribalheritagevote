-- Migration 014: Male & Female Sub-Categories (Award Tracks) for Categories 2, 3, 4, 5
-- Allows separate Male and Female awards, and independent voter ballot voting per gender track.

-- 1. Extend Nominations with sub_category track
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50) NOT NULL DEFAULT 'general';

ALTER TABLE public.nominations 
DROP CONSTRAINT IF EXISTS chk_nomination_sub_category;

ALTER TABLE public.nominations 
ADD CONSTRAINT chk_nomination_sub_category CHECK (sub_category IN ('male', 'female', 'general'));

CREATE INDEX IF NOT EXISTS idx_nominations_sub_category ON public.nominations(category_id, sub_category);

-- 2. Extend Votes with sub_category track
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50) NOT NULL DEFAULT 'general';

ALTER TABLE public.votes 
DROP CONSTRAINT IF EXISTS chk_vote_sub_category;

ALTER TABLE public.votes 
ADD CONSTRAINT chk_vote_sub_category CHECK (sub_category IN ('male', 'female', 'general'));

-- 3. Replace old per-category constraint with per-category + sub-category track constraint
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_contest_category_voter;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_contest_category_subcat_voter;

ALTER TABLE public.votes 
ADD CONSTRAINT uq_contest_category_subcat_voter UNIQUE (contest_id, category_id, sub_category, voter_id);

CREATE INDEX IF NOT EXISTS idx_votes_category_subcat ON public.votes(category_id, sub_category);

-- 4. Update Atomic Voting Function for 12 Award Tracks (8 Categories with 4 M/F Tracks)
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
    v_sub_category VARCHAR(50);
    v_vote_id UUID;
    v_voted_count INT;
    v_voted_tracks TEXT[];
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
    SELECT id, artist_profile_id, category_id, COALESCE(sub_category, 'general') as sub_category, status, is_disqualified INTO v_nomination
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
    v_sub_category := v_nomination.sub_category;

    -- 5. Insert vote into votes table (guaranteed atomic per category + sub_category)
    BEGIN
        INSERT INTO public.votes (
            contest_id,
            category_id,
            sub_category,
            voter_id,
            nomination_id,
            artist_profile_id,
            ip_hash,
            user_agent_hash,
            server_timestamp
        ) VALUES (
            p_contest_id,
            v_category_id,
            v_sub_category,
            v_voter_id,
            p_nomination_id,
            v_nomination.artist_profile_id,
            p_ip_hash,
            p_user_agent_hash,
            v_now
        ) RETURNING id INTO v_vote_id;
    EXCEPTION
        WHEN unique_violation THEN
            IF v_sub_category = 'male' THEN
                RAISE EXCEPTION 'DUPLICATE_CATEGORY_VOTE: You have already cast your vote for the Male track in this category. You may still vote for the Female track.';
            ELSIF v_sub_category = 'female' THEN
                RAISE EXCEPTION 'DUPLICATE_CATEGORY_VOTE: You have already cast your vote for the Female track in this category. You may still vote for the Male track.';
            ELSE
                RAISE EXCEPTION 'DUPLICATE_CATEGORY_VOTE: You have already voted in this category.';
            END IF;
    END;

    -- 6. Atomically update materialized vote count on nominations table
    UPDATE public.nominations
    SET vote_count = vote_count + 1
    WHERE id = p_nomination_id;

    -- 7. Calculate remaining ballot progress across all 12 tracks
    SELECT count(*), array_agg(category_id || '_' || sub_category)
    INTO v_voted_count, v_voted_tracks
    FROM public.votes
    WHERE contest_id = p_contest_id AND voter_id = v_voter_id;

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'category_id', v_category_id,
        'sub_category', v_sub_category,
        'voted_count', v_voted_count,
        'total_tracks', 12,
        'all_completed', (v_voted_count >= 12),
        'voted_tracks', v_voted_tracks,
        'timestamp', v_now
    );
END;
$$;
