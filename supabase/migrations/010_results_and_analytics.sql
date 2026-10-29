-- Migration 010: Official Results Snapshots and Analytics Functions

CREATE TABLE IF NOT EXISTS public.result_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE RESTRICT UNIQUE,
    snapshot_data JSONB NOT NULL,
    total_votes BIGINT NOT NULL,
    finalized_by UUID NOT NULL REFERENCES public.profiles(id),
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    checksum_sha256 VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_result_snapshots_contest ON public.result_snapshots(contest_id);

ALTER TABLE public.result_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can read snapshots only if the contest has results_published = true
CREATE POLICY "Public can view published result snapshots"
    ON public.result_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contests
            WHERE contests.id = result_snapshots.contest_id
            AND contests.results_published = TRUE
        )
        OR public.is_admin(auth.uid())
    );

-- Secure Leaderboard Query Function
-- Honors contest leaderboard_visibility setting:
-- - 'hidden': returns empty array to non-admins
-- - 'live': returns real-time vote totals
-- - 'delayed': returns results only when contest is closed or finalized
CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_contest_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_state VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_contest RECORD;
    v_is_admin BOOLEAN := FALSE;
    v_results JSONB;
BEGIN
    -- Check contest visibility
    SELECT status, leaderboard_visibility, results_published INTO v_contest
    FROM public.contests
    WHERE id = p_contest_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('entries', '[]'::jsonb, 'total', 0, 'visible', FALSE);
    END IF;

    -- Check if requester is admin
    IF auth.uid() IS NOT NULL THEN
        v_is_admin := public.is_admin(auth.uid());
    END IF;

    -- Enforce visibility policy
    IF NOT v_is_admin THEN
        IF v_contest.leaderboard_visibility = 'hidden' AND NOT v_contest.results_published THEN
            RETURN jsonb_build_object('entries', '[]'::jsonb, 'total', 0, 'visible', FALSE, 'message', 'Leaderboard is currently hidden during voting.');
        END IF;

        IF v_contest.leaderboard_visibility = 'delayed' AND v_contest.status IN ('draft', 'scheduled', 'open', 'paused') THEN
            RETURN jsonb_build_object('entries', '[]'::jsonb, 'total', 0, 'visible', FALSE, 'message', 'Leaderboard results will be published after voting closes.');
        END IF;
    END IF;

    -- Fetch ranked entries
    WITH ranked_nominations AS (
        SELECT
            n.id AS nomination_id,
            n.title AS nomination_title,
            n.vote_count,
            ap.id AS artist_profile_id,
            ap.stage_name,
            ap.full_name,
            ap.state,
            ap.district,
            p.avatar_url,
            cc.name AS category_name,
            DENSE_RANK() OVER (ORDER BY n.vote_count DESC) AS rank
        FROM public.nominations n
        JOIN public.artist_profiles ap ON n.artist_profile_id = ap.id
        JOIN public.profiles p ON ap.user_id = p.id
        JOIN public.contest_categories cc ON n.category_id = cc.id
        WHERE n.contest_id = p_contest_id
          AND n.status = 'approved'
          AND (p_category_id IS NULL OR n.category_id = p_category_id)
          AND (p_state IS NULL OR ap.state = p_state)
    )
    SELECT jsonb_build_object(
        'visible', TRUE,
        'entries', COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb),
        'total', (SELECT COUNT(*) FROM ranked_nominations)
    ) INTO v_results
    FROM (
        SELECT * FROM ranked_nominations
        ORDER BY rank ASC, stage_name ASC
        LIMIT p_limit OFFSET p_offset
    ) r;

    RETURN v_results;
END;
$$;
