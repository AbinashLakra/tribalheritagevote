import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { nominationReviewSchema } from '@/features/nominations/schemas';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate reviewer
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 2. Check role authorization (Reviewer or Admin)
    const { data: userRole } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['reviewer', 'admin', 'super_admin'])
      .single();

    if (!userRole) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Reviewer or Admin role required.' },
        { status: 403 }
      );
    }

    // 3. Validate review input
    const validation = await validateRequestBody(request, nominationReviewSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { nominationId, action, reviewerNotes, rejectionReason } = validation.data;

    let targetStatus: 'approved' | 'rejected' | 'correction_required';
    if (action === 'approve') targetStatus = 'approved';
    else if (action === 'reject') targetStatus = 'rejected';
    else targetStatus = 'correction_required';

    // 4. Update nomination status atomically
    const { data: updatedNomination, error: updateError } = await admin
      .from('nominations')
      .update({
        status: targetStatus,
        reviewer_notes: reviewerNotes || null,
        rejection_reason: rejectionReason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', nominationId)
      .select('id, title, status')
      .single();

    if (updateError || !updatedNomination) {
      return NextResponse.json(
        { success: false, error: 'Failed to update nomination moderation status.' },
        { status: 500 }
      );
    }

    // 5. Audit log
    await logAuditEvent({
      actorId: user.id,
      action: `nomination_${action}`,
      targetEntity: 'nominations',
      targetId: nominationId,
      details: {
        action,
        newStatus: targetStatus,
        reviewerNotes,
        rejectionReason,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedNomination,
      message: `Nomination marked as ${targetStatus}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Moderation action failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
