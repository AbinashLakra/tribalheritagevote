import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createClient } from '@/lib/supabase/server';
import { nominationReviewSchema } from '@/features/nominations/schemas';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    // 1. Check if logged in via dual-role Admin Console session
    const adminSession = await getAdminSession();
    let isAuthorized = false;
    let reviewerName = 'Admin';
    let actorId = 'admin-user';

    if (adminSession) {
      if (adminSession.role === 'super_admin' || adminSession.permissions?.can_moderate_videos) {
        isAuthorized = true;
        reviewerName = adminSession.name || adminSession.username;
        actorId = adminSession.adminId || adminSession.username;
      }
    }

    // 2. Fallback to Supabase Auth session if not logged in via admin cookie
    if (!isAuthorized) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = createAdminClient();
        const { data: userRole } = await admin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['reviewer', 'admin', 'super_admin'])
          .maybeSingle();

        if (userRole) {
          isAuthorized = true;
          reviewerName = user.email || 'Staff Reviewer';
          actorId = user.id;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Reviewer or Video Moderator privileges required.' },
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

    const admin = createAdminClient();

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
      .select('id, title, status, artist_profile_id')
      .single();

    if (updateError || !updatedNomination) {
      return NextResponse.json(
        { success: false, error: 'Failed to update nomination status: ' + updateError?.message },
        { status: 500 }
      );
    }

    // 5. Audit Log Entry
    await logAuditEvent({
      actorId,
      action: `nomination_${action}`,
      targetEntity: 'nominations',
      targetId: nominationId,
      details: {
        reviewer: reviewerName,
        action,
        status: targetStatus,
        notes: reviewerNotes,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Nomination marked as ${targetStatus.toUpperCase()} by ${reviewerName}.`,
      data: updatedNomination,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error reviewing nomination';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
