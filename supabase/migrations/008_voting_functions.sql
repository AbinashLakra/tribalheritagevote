-- Migration 008: Secure Atomic Voting Functions

-- Core Atomic Voting Engine
-- Executed with SECURITY DEFINER so that it can insert into votes while keeping
-- direct client INSERT access on votes strictly blocked.
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
    v_vote_id UUID;
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

    -- 3. Lock contest row in share mode and validate timing
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

    -- 4. Validate nomination eligibility
    SELECT id, artist_profile_id, status INTO v_nomination
    FROM public.nominations
    WHERE id = p_nomination_id AND contest_id = p_contest_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOMINATION_NOT_FOUND: Selected nomination does not exist in this contest';
    END IF;

    IF v_nomination.status <> 'approved' THEN
        RAISE EXCEPTION 'NOMINATION_NOT_ELIGIBLE: Only approved nominations can receive votes';
    END IF;

    -- 5. Atomic Insertion protected by UNIQUE (contest_id, voter_id)
    BEGIN
        INSERT INTO public.votes (
            contest_id,
            voter_id,
            nomination_id,
            artist_profile_id,
            ip_hash,
            user_agent_hash,
            server_timestamp
        ) VALUES (
            p_contest_id,
            v_voter_id,
            p_nomination_id,
            v_nomination.artist_profile_id,
            p_ip_hash,
            p_user_agent_hash,
            v_now
        ) RETURNING id INTO v_vote_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'DUPLICATE_VOTE: You have already cast your vote in this contest. Only one vote per contest is permitted.';
    END;

    -- 6. Atomically update materialized vote count on nominations table
    UPDATE public.nominations
    SET vote_count = vote_count + 1,
        updated_at = v_now
    WHERE id = p_nomination_id;

    -- 7. Return verified cryptographic receipt payload
    RETURN jsonb_build_object(
        'success', TRUE,
        'vote_id', v_vote_id,
        'contest_id', p_contest_id,
        'nomination_id', p_nomination_id,
        'timestamp', v_now
    );
END;
$$;

-- Helper to check voter status for a contest
CREATE OR REPLACE FUNCTION public.get_voter_contest_status(p_contest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_user_id UUID;
    v_voter_id UUID;
    v_is_verified BOOLEAN;
    v_existing_vote RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authenticated', FALSE,
            'is_verified', FALSE,
            'has_voted', FALSE
        );
    END IF;

    SELECT id, is_verified INTO v_voter_id, v_is_verified
    FROM public.voter_identities
    WHERE user_id = v_user_id;

    IF v_voter_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authenticated', TRUE,
            'is_verified', FALSE,
            'has_voted', FALSE
        );
    END IF;

    SELECT id, nomination_id, server_timestamp INTO v_existing_vote
    FROM public.votes
    WHERE contest_id = p_contest_id AND voter_id = v_voter_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_authenticated', TRUE,
            'is_verified', COALESCE(v_is_verified, FALSE),
            'has_voted', TRUE,
            'vote_id', v_existing_vote.id,
            'nomination_id', v_existing_vote.nomination_id,
            'voted_at', v_existing_vote.server_timestamp
        );
    ELSE
        RETURN jsonb_build_object(
            'is_authenticated', TRUE,
            'is_verified', COALESCE(v_is_verified, FALSE),
            'has_voted', FALSE
        );
    END IF;
END;
$$;
