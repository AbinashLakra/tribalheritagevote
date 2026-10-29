import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId') || 'a1111111-1111-1111-1111-111111111111';
    const state = searchParams.get('state') || null;
    const categoryId = searchParams.get('categoryId') || null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const admin = createAdminClient();

    // Call PostgreSQL RPC `get_leaderboard` which enforces visibility policy
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

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

