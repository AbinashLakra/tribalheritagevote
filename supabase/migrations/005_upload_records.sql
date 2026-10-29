-- Migration 005: Cloudflare R2 Media Upload Records
CREATE TABLE IF NOT EXISTS public.upload_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100) NOT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'verified', 'failed')),
    public_url TEXT NULL,
    checksum_sha256 VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_upload_records_user ON public.upload_records(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_records_status ON public.upload_records(upload_status);

-- Add foreign key constraint to nominations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_nominations_upload_record'
    ) THEN
        ALTER TABLE public.nominations
            ADD CONSTRAINT fk_nominations_upload_record
            FOREIGN KEY (upload_record_id)
            REFERENCES public.upload_records(id)
            ON DELETE SET NULL;
    END IF;
END $$;
