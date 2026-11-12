import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth/admin-session';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';
import { DEFAULT_CONTEST_SETTINGS, extractContestSettings } from '@/lib/voting/vote-display-calculator';

const settingsUpdateSchema = z.object({
  contestId: z.string().optional(),
  showPublicVotes: z.boolean().optional(),
  boostEnabled: z.boolean().optional(),
  boostVelocityPerDay: z.number().min(100).max(10000).optional(),
});

async function checkAdminAuth() {
  const adminSession = await getAdminSession();
  if (adminSession) {
    if (
      adminSession.role === 'super_admin' ||
      adminSession.role === 'co_admin' ||
      adminSession.permissions?.can_manage_contest
    ) {
      return {
        isAuthorized: true,
        actorId: adminSession.adminId || adminSession.username,
        actorName: adminSession.name || adminSession.username,
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    const { data: role } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (role) {
      return {
        isAuthorized: true,
        actorId: user.id,
        actorName: user.email || 'Staff Admin',
      };
    }
  }

  return { isAuthorized: false, actorId: '', actorName: '' };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');

    const admin = createAdminClient();
    let query = admin.from('contests').select('*');
    if (contestId) {
      query = query.eq('id', contestId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }
    const { data: contest, error } = await query.maybeSingle();

    if (error || !contest) {
      return NextResponse.json(
        { success: false, error: 'Contest record not found' },
        { status: 404 }
      );
    }

    const settings = extractContestSettings(contest);

    return NextResponse.json({
      success: true,
      data: {
        contestId: contest.id,
        title: contest.title,
        status: contest.status,
        votingStartAt: contest.voting_start_at,
        votingEndAt: contest.voting_end_at,
        leaderboardVisibility: contest.leaderboard_visibility,
        settings,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching contest settings';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Super Admin or Executive privileges required.' },
        { status: 401 }
      );
    }

    const validation = await validateRequestBody(request, settingsUpdateSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { contestId, showPublicVotes, boostEnabled, boostVelocityPerDay } = validation.data;
    const admin = createAdminClient();

    let query = admin.from('contests').select('*');
    if (contestId) {
      query = query.eq('id', contestId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }
    const { data: contest, error: fetchError } = await query.maybeSingle();

    if (fetchError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Contest record not found' },
        { status: 404 }
      );
    }

    const currentSettings = extractContestSettings(contest);
    const updatedSettings: Record<string, any> = {
      ...currentSettings,
      show_public_votes: typeof showPublicVotes === 'boolean' ? showPublicVotes : currentSettings.show_public_votes,
      boost_enabled: typeof boostEnabled === 'boolean' ? boostEnabled : currentSettings.boost_enabled,
      boost_velocity_per_day: typeof boostVelocityPerDay === 'number' ? boostVelocityPerDay : currentSettings.boost_velocity_per_day,
    };

    const updatePayload: Record<string, any> = {
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
    };

    // Keep leaderboard_visibility synced: 'live' when show_public_votes is true, 'hidden' when false
    if (typeof showPublicVotes === 'boolean') {
      updatePayload.leaderboard_visibility = showPublicVotes ? 'live' : 'hidden';
    }

    const { data: updatedContest, error: updateError } = await admin
      .from('contests')
      .update(updatePayload)
      .eq('id', contest.id)
      .select('*')
      .single();

    if (updateError || !updatedContest) {
      return NextResponse.json(
        { success: false, error: updateError?.message || 'Failed to update settings' },
        { status: 500 }
      );
    }

    await logAuditEvent({
      actorId: auth.actorId,
      action: 'contest_settings_updated',
      targetEntity: 'contests',
      targetId: contest.id,
      details: {
        actor: auth.actorName,
        previousSettings: currentSettings,
        updatedSettings,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        contestId: updatedContest.id,
        settings: extractContestSettings(updatedContest),
        leaderboardVisibility: updatedContest.leaderboard_visibility,
      },
      message: 'Contest settings and public vote visibility updated successfully in real-time.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating contest settings';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

