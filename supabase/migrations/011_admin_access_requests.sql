-- Migration 011: Admin Access Requests & Granular Sub-Admin Permissions
CREATE TABLE IF NOT EXISTS public.admin_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    permissions JSONB NOT NULL DEFAULT '{"can_moderate_videos": false, "can_manage_contest": false, "can_view_audit_logs": false, "can_export_data": false, "can_view_analytics": true}'::jsonb,
    is_phone_verified BOOLEAN NOT NULL DEFAULT false,
    reviewed_by VARCHAR(100) NULL,
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_admin_request_phone UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS idx_admin_access_requests_phone ON public.admin_access_requests(phone);
CREATE INDEX IF NOT EXISTS idx_admin_access_requests_status ON public.admin_access_requests(status);

-- Enable RLS
ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;

-- Allow public to submit their own request
CREATE POLICY "Allow public insert for admin access requests"
    ON public.admin_access_requests
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow public select
CREATE POLICY "Allow public select on admin_access_requests"
    ON public.admin_access_requests
    FOR SELECT
    TO public
    USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on admin_access_requests"
    ON public.admin_access_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

