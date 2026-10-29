-- Migration 003: Contests and Cultural Art Categories
CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    nomination_start_at TIMESTAMPTZ NOT NULL,
    nomination_end_at TIMESTAMPTZ NOT NULL,
    voting_start_at TIMESTAMPTZ NOT NULL,
    voting_end_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'open', 'paused', 'closed', 'finalized')),
    leaderboard_visibility VARCHAR(20) NOT NULL DEFAULT 'live' CHECK (leaderboard_visibility IN ('hidden', 'live', 'delayed')),
    results_published BOOLEAN NOT NULL DEFAULT FALSE,
    reopening_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_contest_nomination_dates CHECK (nomination_start_at < nomination_end_at),
    CONSTRAINT chk_contest_voting_dates CHECK (voting_start_at < voting_end_at)
);

CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_slug ON public.contests(slug);

CREATE TRIGGER trg_contests_updated_at
    BEFORE UPDATE ON public.contests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Categories per contest
CREATE TABLE IF NOT EXISTS public.contest_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    slug VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_contest_category_slug UNIQUE (contest_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_contest_categories_contest ON public.contest_categories(contest_id);
