-- Migration 012: Dedicated OTP Codes Table for Real Phone Verification
CREATE TABLE IF NOT EXISTS public.otp_codes (
    phone VARCHAR(20) PRIMARY KEY,
    code_hash VARCHAR(64) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Allow service role full access on otp_codes"
    ON public.otp_codes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

