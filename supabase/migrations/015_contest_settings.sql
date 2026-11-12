-- Migration 015: Contest Settings for Public Vote Visibility & Display Layer Controls
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"show_public_votes": true, "boost_enabled": true, "boost_velocity_per_day": 1000}'::jsonb;

UPDATE public.contests 
SET settings = '{"show_public_votes": true, "boost_enabled": true, "boost_velocity_per_day": 1000}'::jsonb 
WHERE settings IS NULL;

