import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enhanceNominationsWithBoost, extractContestSettings } from '@/lib/voting/vote-display-calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId') || 'a1111111-1111-1111-1111-111111111111';
    const state = searchParams.get('state') || null;
    const categoryId = searchParams.get('categoryId') || null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const admin = createAdminClient();

    // 1. Fetch contest configuration
    const { data: contest } = await admin
      .from('contests')
      .select('id, title, status, leaderboard_visibility, results_published, settings, voting_start_at, voting_end_at, reopening_reason')
      .eq('id', contestId)
      .maybeSingle();

    const contestSettings = extractContestSettings(contest);

    // If public visibility is turned off by Admin
    if (!contestSettings.show_public_votes || contest?.leaderboard_visibility === 'hidden') {
      return NextResponse.json({
        success: true,
        data: {
          entries: [],
          total: 0,
          visible: false,
          message: 'Leaderboard is currently hidden during voting by the administrator.',
        },
      });
    }

    // 2. Call PostgreSQL RPC `get_leaderboard`
    const { data, error } = await admin.rpc('get_leaderboard', {
      p_contest_id: contestId,
      p_category_id: categoryId,
      p_state: state,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rawEntries = (data as { entries?: any[] })?.entries || [];
    const normalized = rawEntries.map((e) => ({
      ...e,
      id: e.nomination_id,
      vote_count: Number(e.vote_count || 0),
    }));

    const boosted = enhanceNominationsWithBoost(normalized, contest);
    boosted.sort((a, b) => b.vote_count - a.vote_count);

    const entries = boosted.map((e, idx) => ({
      ...e,
      rank: idx + 1,
      vote_count: e.vote_count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...(typeof data === 'object' ? data : {}),
        entries,
        visible: true,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

