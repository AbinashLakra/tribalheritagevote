-- Seed Data for Development and Testing
-- Realistic Adivasi Cultural Arts Contest in Rourkela, Odisha

DO $$
DECLARE
    v_contest_id UUID := 'a1111111-1111-1111-1111-111111111111';
    v_cat_dance UUID := 'b1111111-1111-1111-1111-111111111111';
    v_cat_music UUID := 'b2222222-2222-2222-2222-222222222222';
    v_cat_paint UUID := 'b3333333-3333-3333-3333-333333333333';
    v_cat_craft UUID := 'b4444444-4444-4444-4444-444444444444';
BEGIN
    -- 1. Insert Initial Contest
    INSERT INTO public.contests (
        id,
        title,
        slug,
        description,
        timezone,
        nomination_start_at,
        nomination_end_at,
        voting_start_at,
        voting_end_at,
        status,
        leaderboard_visibility,
        results_published
    ) VALUES (
        v_contest_id,
        'National Adivasi Cultural Arts Awards 2026 — Rourkela Edition',
        'national-adivasi-awards-2026',
        'Celebrating and recognizing master Adivasi artists, dancers, singers, and craftsmen from across India, hosted in Rourkela, Sundargarh district, Odisha.',
        'Asia/Kolkata',
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '2 days',
        NOW() + INTERVAL '14 days',
        'open',
        'live',
        FALSE
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Cultural Art Categories
    INSERT INTO public.contest_categories (id, contest_id, slug, name, description, display_order)
    VALUES
        (v_cat_dance, v_contest_id, 'tribal-dance', 'Tribal & Folk Dance', 'Santhali, Karma, Chhau, Ho, and indigenous ritual dances', 1),
        (v_cat_music, v_contest_id, 'folk-music', 'Folk Music & Tribal Vocals', 'Traditional oral songs, Mandar rhythm, and ancestral folk melodies', 2),
        (v_cat_paint, v_contest_id, 'traditional-painting', 'Sohrai, Khovar & Tribal Painting', 'Sacred earth-pigment mural and canvas art forms of Eastern India', 3),
        (v_cat_craft, v_contest_id, 'handicrafts', 'Indigenous Crafts & Metalwork', 'Dokra lost-wax casting, terracotta pottery, and bamboo crafts', 4)
    ON CONFLICT (id) DO NOTHING;
END $$;
