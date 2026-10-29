import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canTransitionContest } from '@/lib/constants/contest-states';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';

const stateTransitionSchema = z.object({
  contestId: z.string().uuid('Invalid contest ID'),
  newState: z.enum(['draft', 'scheduled', 'open', 'paused', 'closed', 'finalized']),
  reason: z.string().optional(),
  votingEndAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Check admin role
    const { data: role } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required for contest lifecycle controls.' },
        { status: 403 }
      );
    }

    const validation = await validateRequestBody(request, stateTransitionSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { contestId, newState, reason, votingEndAt } = validation.data;

    // Fetch existing contest
    const { data: contest, error: fetchError } = await admin
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (fetchError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    const previousState = contest.status;

    // Check valid transition
    if (!canTransitionContest(previousState, newState)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition: Cannot transition contest from '${previousState}' to '${newState}'.`,
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
    }

    // Prepare update payload
    const updatePayload: Record<string, unknown> = {
      status: newState,
      updated_at: new Date().toISOString(),
    };

    if (isReopening) {
      updatePayload.reopening_reason = reason;
      updatePayload.voting_end_at = votingEndAt;
    }

    // Update contest state
    const { data: updatedContest, error: updateError } = await admin
      .from('contests')
      .update(updatePayload)
      .eq('id', contestId)
      .select('*')
      .single();

    if (updateError || !updatedContest) {
      return NextResponse.json(
        { success: false, error: updateError?.message || 'Failed to update contest state' },
        { status: 500 }
      );
    }

    // Record lifecycle event
    await admin.from('contest_events').insert({
      contest_id: contestId,
      event_type: `contest_${newState}`,
      previous_state: previousState,
      new_state: newState,
      actor_id: user.id,
      reason: reason || null,
      metadata: { isReopening, votingEndAt },
    });

    // Record audit log
    await logAuditEvent({
      actorId: user.id,
      action: `contest_state_changed_to_${newState}`,
      targetEntity: 'contests',
      targetId: contestId,
      details: { previousState, newState, reason, votingEndAt },
    });

    return NextResponse.json({
      success: true,
      data: updatedContest,
      message: `Contest state successfully transitioned to ${newState.toUpperCase()}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error changing contest state';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

