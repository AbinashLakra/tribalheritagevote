import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId') || 'a1111111-1111-1111-1111-111111111111';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();

    // 1. Fetch Contest Info
    const { data: contest } = await admin
      .from('contests')
      .select('id, title, status, voting_start_at, voting_end_at')
      .eq('id', contestId)
      .maybeSingle();

    // 2. Fetch all 8 Categories
    const { data: dbCategories } = await admin
      .from('contest_categories')
      .select('id, name, slug, display_order')
      .eq('contest_id', contestId)
      .order('display_order', { ascending: true });

    const categories =
      dbCategories && dbCategories.length > 0
        ? dbCategories
        : ART_CATEGORIES.map((c, index) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            display_order: index + 1,
          }));

    // 3. Fetch all approved nominations grouped by category
    const { data: nominations } = await admin
      .from('nominations')
      .select(`
        id,
        category_id,
        title,
        description,
        vote_count,
        upload_record:upload_records(public_url),
        artist:artist_profiles(id, stage_name, full_name, state, district, avatar_url)
      `)
      .eq('contest_id', contestId)
      .eq('status', 'approved')
      .eq('is_disqualified', false);

    // Group nominations by category_id
    const categoryNominations: Record<string, any[]> = {};
    categories.forEach((cat) => {
      categoryNominations[cat.id] = (nominations || []).filter(
        (nom) => nom.category_id === cat.id
      );
    });

    // 4. Voter Authentication and Ballot State
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          contest: contest || { id: contestId, title: 'Tribal Heritage Vote 2026', status: 'open' },
          isAuthenticated: false,
          isVerified: false,
          voterPhone: null,
          votedCount: 0,
          totalCategories: 8,
          votedCategoryIds: [],
          votedNominationIds: [],
          allCompleted: false,
          categories,
          nominationsByCategory: categoryNominations,
          ballotVotes: [],
        },
      });
    }

    // Check voter identity
    const { data: voterIdentity } = await admin
      .from('voter_identities')
      .select('id, is_verified, phone_country_code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!voterIdentity || !voterIdentity.is_verified) {
      return NextResponse.json({
        success: true,
        data: {
          contest: contest || { id: contestId, title: 'Tribal Heritage Vote 2026', status: 'open' },
          isAuthenticated: true,
          isVerified: false,
          voterPhone: user.phone || user.user_metadata?.phone || null,
          votedCount: 0,
          totalCategories: 8,
          votedCategoryIds: [],
          votedNominationIds: [],
          allCompleted: false,
          categories,
          nominationsByCategory: categoryNominations,
          ballotVotes: [],
        },
      });
    }

    // Fetch all votes cast by this verified voter in this contest
    const { data: voterVotes } = await admin
      .from('votes')
      .select(`
        id,
        category_id,
        nomination_id,
        server_timestamp,
        nomination:nominations(title),
        artist:artist_profiles(stage_name, state, district)
      `)
      .eq('contest_id', contestId)
      .eq('voter_id', voterIdentity.id);

    const votedCategoryIds = (voterVotes || [])
      .map((v) => v.category_id)
      .filter(Boolean);

    const votedNominationIds = (voterVotes || [])
      .map((v) => v.nomination_id)
      .filter(Boolean);

    const votedCount = votedCategoryIds.length;
    const allCompleted = votedCount >= 8;

    return NextResponse.json({
      success: true,
      data: {
        contest: contest || { id: contestId, title: 'Tribal Heritage Vote 2026', status: 'open' },
        isAuthenticated: true,
        isVerified: true,
        voterId: voterIdentity.id,
        voterPhone: user.phone || user.user_metadata?.phone || null,
        votedCount,
        totalCategories: 8,
        votedCategoryIds,
        votedNominationIds,
        allCompleted,
        categories,
        nominationsByCategory: categoryNominations,
        ballotVotes: voterVotes || [],
      },
    });
  } catch (err: any) {
    console.error('Error fetching ballot status:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch ballot state.' },
      { status: 500 }
    );
  }
}

