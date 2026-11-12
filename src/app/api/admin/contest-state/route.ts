import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth/admin-session';
import { canTransitionContest } from '@/lib/constants/contest-states';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';

const contestUpdateSchema = z.object({
  contestId: z.string().min(1, 'Contest ID is required').optional(),
  newState: z.enum(['draft', 'scheduled', 'open', 'paused', 'closed', 'finalized']).optional(),
  votingStartAt: z.string().optional().nullable(),
  votingEndAt: z.string().optional().nullable(),
  reason: z.string().optional(),
  leaderboardVisibility: z.enum(['live', 'hidden', 'delayed']).optional(),
  showPublicVotes: z.boolean().optional(),
  boostEnabled: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Dual-Auth: Admin Cookie Session or Supabase Auth User
    const adminSession = await getAdminSession();
    let isAuthorized = false;
    let actorId = 'super-admin';
    let actorName = 'Main Administrator';

    if (adminSession) {
      if (
        adminSession.role === 'super_admin' ||
        adminSession.role === 'co_admin' ||
        adminSession.permissions?.can_manage_contest
      ) {
        isAuthorized = true;
        actorId = adminSession.adminId || adminSession.username;
        actorName = adminSession.name || adminSession.username;
      }
    }

    if (!isAuthorized) {
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
          isAuthorized = true;
          actorId = user.id;
          actorName = user.email || 'Staff Admin';
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Super Admin or Second Main Admin access required.' },
        { status: 401 }
      );
    }

    // 2. Validate Request Body
    const validation = await validateRequestBody(request, contestUpdateSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const {
      contestId,
      newState,
      votingStartAt,
      votingEndAt,
      reason,
      leaderboardVisibility,
      showPublicVotes,
      boostEnabled,
    } = validation.data;

    const admin = createAdminClient();

    // 3. Fetch existing contest record
    let query = admin.from('contests').select('*');
    if (contestId) {
      query = query.eq('id', contestId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }
    const { data: contest, error: fetchError } = await query.maybeSingle();

    if (fetchError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Contest record not found in the database.' },
        { status: 404 }
      );
    }

    const resolvedContestId = contest.id;
    const previousState = contest.status;
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let transitionMessage = '';

    // 4. Handle State Transition if requested
    if (newState && newState !== previousState) {
      if (!canTransitionContest(previousState, newState)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid transition: Cannot move contest from '${previousState}' to '${newState}'.`,
          },
          { status: 400 }
        );
      }

      // Reopening Policy Verification
      const isReopening = previousState === 'closed' && newState === 'open';
      if (isReopening) {
        if (!reason || reason.trim().length < 10) {
          return NextResponse.json(
            {
              success: false,
              error: 'A mandatory written justification (minimum 10 characters) is required to reopen voting.',
            },
            { status: 400 }
          );
        }

        if (!votingEndAt || new Date(votingEndAt) <= new Date()) {
          return NextResponse.json(
            {
              success: false,
              error: 'A valid future closing date and time is required to reopen voting.',
            },
            { status: 400 }
          );
        }
        updatePayload.reopening_reason = reason;
      }

      updatePayload.status = newState;
      transitionMessage += `Contest status changed to ${newState.toUpperCase()}. `;
    }

    // 5. Handle Voting Start & End Schedule Updates
    if (votingStartAt) {
      updatePayload.voting_start_at = new Date(votingStartAt).toISOString();
      transitionMessage += `Voting start scheduled for ${new Date(votingStartAt).toLocaleString('en-IN')}. `;
    }

    if (votingEndAt) {
      updatePayload.voting_end_at = new Date(votingEndAt).toISOString();
      transitionMessage += `Voting end / countdown target updated to ${new Date(votingEndAt).toLocaleString('en-IN')}. `;
    }

    // 5b. Handle Public Visibility & Boost Settings Updates
    if (leaderboardVisibility) {
      updatePayload.leaderboard_visibility = leaderboardVisibility;
      transitionMessage += `Leaderboard visibility set to ${leaderboardVisibility}. `;
    }

    if (typeof showPublicVotes === 'boolean' || typeof boostEnabled === 'boolean') {
      const existingSettings = (contest.settings as Record<string, any>) || {};
      const newSettings = {
        ...existingSettings,
        ...(typeof showPublicVotes === 'boolean' ? { show_public_votes: showPublicVotes } : {}),
        ...(typeof boostEnabled === 'boolean' ? { boost_enabled: boostEnabled } : {}),
      };
      updatePayload.settings = newSettings;
      if (typeof showPublicVotes === 'boolean') {
        updatePayload.leaderboard_visibility = showPublicVotes ? 'live' : 'hidden';
      }
      transitionMessage += `Contest display settings updated. `;
    }

    // 6. Update Contest Record
    const { data: updatedContest, error: updateError } = await admin
      .from('contests')
      .update(updatePayload)
      .eq('id', resolvedContestId)
      .select('*')
      .single();

    if (updateError || !updatedContest) {
      return NextResponse.json(
        { success: false, error: updateError?.message || 'Failed to update contest settings.' },
        { status: 500 }
      );
    }

    // 7. Audit log & Lifecycle event
    await logAuditEvent({
      actorId,
      action: 'contest_lifecycle_updated',
      targetEntity: 'contests',
      targetId: resolvedContestId,
      details: {
        actor: actorName,
        previousState,
        newState: newState || previousState,
        votingStartAt,
        votingEndAt,
        reason,
      },
    });

    if (newState && newState !== previousState) {
      await admin.from('contest_events').insert({
        contest_id: resolvedContestId,
        event_type: `contest_${newState}`,
        previous_state: previousState,
        new_state: newState,
        actor_id: actorId,
        reason: reason || null,
        metadata: { votingStartAt, votingEndAt },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedContest,
      message: transitionMessage.trim() || 'Contest settings successfully updated in real-time.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error changing contest state';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
