import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');

    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'contestId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          isVerified: false,
          hasVoted: false,
          votedCategoryIds: [],
          votedNominationIds: [],
        },
      });
    }

    const admin = createAdminClient();
    const { data: voterIdentity } = await admin
      .from('voter_identities')
      .select('id, is_verified')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!voterIdentity || !voterIdentity.is_verified) {
      return NextResponse.json({
        success: true,
        data: {
          isAuthenticated: true,
          isVerified: false,
          hasVoted: false,
          votedCategoryIds: [],
          votedNominationIds: [],
        },
      });
    }

    const { data: votes } = await admin
      .from('votes')
      .select('id, category_id, nomination_id, server_timestamp')
      .eq('contest_id', contestId)
      .eq('voter_id', voterIdentity.id);

    const votedCategoryIds = (votes || []).map((v) => v.category_id).filter(Boolean);
    const votedNominationIds = (votes || []).map((v) => v.nomination_id).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        isVerified: true,
        hasVoted: votedNominationIds.length > 0,
        votedCount: votedNominationIds.length,
        votedCategoryIds,
        votedNominationIds,
        votedAt: votes?.[0]?.server_timestamp,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query voting status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

