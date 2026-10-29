-- Migration 007: Mandatory Row Level Security (RLS) Policies

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_events ENABLE ROW LEVEL SECURITY;

-- 2. Profiles policies
-- Anyone can view public basic profile info (avatar, name)
CREATE POLICY "Public profiles are readable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. User Roles policies
-- Public can view roles, but only admin can manage them
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 4. Contests policies
-- Public can view contests that are scheduled, open, paused, closed, or finalized
CREATE POLICY "Public can view active or scheduled contests"
    ON public.contests FOR SELECT
    USING (status IN ('scheduled', 'open', 'paused', 'closed', 'finalized') OR public.is_admin(auth.uid()));

-- Only admins can insert, update, delete contests
CREATE POLICY "Admins can manage contests"
    ON public.contests FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 5. Contest Categories policies
CREATE POLICY "Public can view categories of accessible contests"
    ON public.contest_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON public.contest_categories FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 6. Artist Profiles policies
-- Public can view verified artist profiles
CREATE POLICY "Public can view verified artist profiles"
    ON public.artist_profiles FOR SELECT
    USING (verification_status = 'verified' OR user_id = auth.uid() OR public.is_reviewer(auth.uid()));

-- Artists can create and edit their own profile
CREATE POLICY "Artists can manage own profile"
    ON public.artist_profiles FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 7. Nominations policies
-- Public can view approved nominations
CREATE POLICY "Public can view approved nominations"
    ON public.nominations FOR SELECT
    USING (status = 'approved' OR artist_profile_id IN (
        SELECT id FROM public.artist_profiles WHERE user_id = auth.uid()
    ) OR public.is_reviewer(auth.uid()));

-- Artists can insert draft nominations for themselves
CREATE POLICY "Artists can submit own nominations"
    ON public.nominations FOR INSERT
    TO authenticated
    WITH CHECK (
        artist_profile_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
        AND status IN ('draft', 'submitted')
    );

-- Artists can update only their own draft or correction_required nominations
CREATE POLICY "Artists can update own draft or correction nominations"
    ON public.nominations FOR UPDATE
    TO authenticated
    USING (
        artist_profile_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
        AND status IN ('draft', 'correction_required')
    )
    WITH CHECK (
        artist_profile_id IN (SELECT id FROM public.artist_profiles WHERE user_id = auth.uid())
    );

-- Reviewers and Admins can update nomination status and notes
CREATE POLICY "Reviewers can moderate nominations"
    ON public.nominations FOR UPDATE
    TO authenticated
    USING (public.is_reviewer(auth.uid()))
    WITH CHECK (public.is_reviewer(auth.uid()));

-- 8. Upload Records policies
-- Users can view their own upload records; reviewers/admins can view all
CREATE POLICY "Users can view own uploads"
    ON public.upload_records FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_reviewer(auth.uid()));

CREATE POLICY "Users can insert own upload records"
    ON public.upload_records FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 9. Voter Identities policies
-- Strictly private: Voters can only view their own identity
CREATE POLICY "Voters can view own voter identity"
    ON public.voter_identities FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 10. Votes policies
-- ⚠️ ZERO PUBLIC WRITE ACCESS TO VOTES TABLE DIRECTLY
-- Public users CANNOT insert or update votes directly.
-- Votes MUST be inserted exclusively via the trusted SECURITY DEFINER function `cast_vote`.
CREATE POLICY "Voters can view own votes"
    ON public.votes FOR SELECT
    TO authenticated
    USING (
        voter_id IN (SELECT id FROM public.voter_identities WHERE user_id = auth.uid())
        OR public.is_admin(auth.uid())
    );

-- 11. Contest Events policies
CREATE POLICY "Admins can view contest events"
    ON public.contest_events FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
