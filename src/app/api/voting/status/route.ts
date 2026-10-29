import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        },
      });
    }

    // Call the RPC helper
    const { data: statusData, error: rpcError } = await supabase.rpc('get_voter_contest_status', {
      p_contest_id: contestId,
    });

    if (rpcError) {
      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 500 }
      );
    }

    const typedStatus = statusData as {
      is_authenticated: boolean;
      is_verified: boolean;
      has_voted: boolean;
      vote_id?: string;
      nomination_id?: string;
      voted_at?: string;
    };

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: typedStatus.is_authenticated,
        isVerified: typedStatus.is_verified,
        hasVoted: typedStatus.has_voted,
        voteId: typedStatus.vote_id,
        votedNominationId: typedStatus.nomination_id,
        votedAt: typedStatus.voted_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query voting status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

