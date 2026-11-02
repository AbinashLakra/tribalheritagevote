import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createClient } from '@/lib/supabase/server';
import { nominationReviewSchema } from '@/features/nominations/schemas';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';
import { getPanelById } from '@/lib/constants/art-categories';

export async function POST(request: NextRequest) {
  try {
    // 1. Check if logged in via dual-role Admin Console session
    const adminSession = await getAdminSession();
    let isAuthorized = false;
    let reviewerName = 'Admin';
    let actorId = 'admin-user';

    if (adminSession) {
      if (
        adminSession.role === 'super_admin' ||
        adminSession.role === 'co_admin' ||
        adminSession.role === 'panel_admin' ||
        adminSession.permissions?.can_moderate_videos
      ) {
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
    const cleanNotes = reviewerNotes?.trim() || null;
    const cleanReason = rejectionReason?.trim() || null;

    if ((action === 'reject' || action === 'request_correction') && !cleanReason && !cleanNotes) {
      return NextResponse.json(
        { success: false, error: 'Please provide a feedback reason for rejecting or requesting correction.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 4. Fetch target nomination to verify category and panel eligibility
    const { data: targetNomination, error: fetchErr } = await admin
      .from('nominations')
      .select('id, category_id, rejection_count, is_disqualified, status, artist_profile_id')
      .eq('id', nominationId)
      .single();

    if (fetchErr || !targetNomination) {
      return NextResponse.json(
        { success: false, error: 'Nomination record could not be found.' },
        { status: 404 }
      );
    }

    // If moderator is a Panel Admin, verify they are only moderating categories in their assigned panel
    if (adminSession && adminSession.role === 'panel_admin') {
      const panelId = adminSession.assignedPanel || 1;
      const panelConfig = getPanelById(panelId);

      if (!panelConfig || !panelConfig.categoryIds.includes(targetNomination.category_id)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access Denied: As Panel ${panelId} Admin, you can only moderate submissions for ${panelConfig?.name || 'your assigned categories'}.`,
          },
          { status: 403 }
        );
      }
    }

    // 5. Determine status and 3-strike disqualification rule
    let targetStatus: 'approved' | 'rejected' | 'correction_required' | 'submitted';
    let newRejectionCount = targetNomination.rejection_count || 0;
    let isDisqualified = targetNomination.is_disqualified || false;
    let finalReason: string | null = cleanReason || cleanNotes || null;

    if (action === 'approve') {
      targetStatus = 'approved';
      finalReason = null;
    } else if (action === 'unapprove') {
      targetStatus = 'submitted';
      finalReason = cleanNotes || 'Nomination approval revoked by admin. Reverted to pending review queue.';
    } else {
      // Rejection or Request Correction counts as an evaluation attempt
      newRejectionCount += 1;
      const feedback = cleanReason || cleanNotes || 'Jury requested correction';
      if (newRejectionCount >= 3) {
        isDisqualified = true;
        targetStatus = 'rejected';
        finalReason = `${feedback} | Permanently disqualified after 3 failed review attempts.`;
      } else {
        targetStatus = action === 'reject' ? 'rejected' : 'correction_required';
        finalReason = feedback;
      }
    }

    // 6. Update nomination status atomically
    const { data: updatedNomination, error: updateError } = await admin
      .from('nominations')
      .update({
        status: targetStatus,
        rejection_count: newRejectionCount,
        is_disqualified: isDisqualified,
        reviewer_notes: cleanNotes,
        rejection_reason: finalReason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', nominationId)
      .select('id, title, status, rejection_count, is_disqualified, artist_profile_id')
      .single();

    if (updateError || !updatedNomination) {
      return NextResponse.json(
        { success: false, error: 'Failed to update nomination status: ' + updateError?.message },
        { status: 500 }
      );
    }

    // 7. Audit Log Entry
    await logAuditEvent({
      actorId,
      action: `nomination_${action}`,
      targetEntity: 'nominations',
      targetId: nominationId,
      details: {
        reviewer: reviewerName,
        action,
        status: targetStatus,
        rejectionCount: newRejectionCount,
        isDisqualified,
        notes: reviewerNotes,
      },
    });

    const statusMessage = isDisqualified
      ? `Nomination rejected and artist DISQUALIFIED (Reached 3/3 maximum strikes).`
      : action === 'approve'
      ? `Nomination approved! Now live for public voting.`
      : action === 'unapprove'
      ? `Nomination unapproved and reverted to pending review.`
      : `Nomination returned for correction (Strike ${newRejectionCount}/3). Feedback saved for artist.`;

    return NextResponse.json({
      success: true,
      message: statusMessage,
      data: updatedNomination,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error reviewing nomination';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE HANDLER: SUPER ADMIN & SECOND MAIN ADMIN PERMANENT DATABASE DELETION
// ─────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || (session.role !== 'super_admin' && session.role !== 'co_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin or Second Main Admin privileges required to permanently delete records.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const nominationId = searchParams.get('nominationId');
    const artistProfileId = searchParams.get('artistProfileId');

    if (!nominationId && !artistProfileId) {
      return NextResponse.json(
        { success: false, error: 'nominationId or artistProfileId query parameter is required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (nominationId) {
      // 1. Delete all votes cast for this nomination
      await admin.from('votes').delete().eq('nomination_id', nominationId);

      // 2. Fetch upload_record_id and artist_profile_id
      const { data: nom } = await admin
        .from('nominations')
        .select('upload_record_id, artist_profile_id')
        .eq('id', nominationId)
        .maybeSingle();

      // 3. Delete nomination
      const { error: nomDelErr } = await admin
        .from('nominations')
        .delete()
        .eq('id', nominationId);

      if (nomDelErr) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete nomination: ' + nomDelErr.message },
          { status: 500 }
        );
      }

      // If artistProfileId was not specified but full deletion requested, delete artist profile as well
      if (searchParams.get('deleteProfile') === 'true' && nom?.artist_profile_id) {
        await admin.from('artist_profiles').delete().eq('id', nom.artist_profile_id);
      }

      await logAuditEvent({
        actorId: session.adminId || 'super-admin',
        action: 'nomination_permanently_deleted',
        targetEntity: 'nominations',
        targetId: nominationId,
        details: { deletedBy: session.name, timestamp: new Date().toISOString() },
      });

      return NextResponse.json({
        success: true,
        message: 'Nomination and related voting records permanently deleted from the database.',
      });
    }

    if (artistProfileId) {
      // Delete votes for all nominations of this artist
      await admin.from('votes').delete().eq('artist_profile_id', artistProfileId);
      // Delete nominations
      await admin.from('nominations').delete().eq('artist_profile_id', artistProfileId);
      // Delete artist profile
      const { error: profDelErr } = await admin
        .from('artist_profiles')
        .delete()
        .eq('id', artistProfileId);

      if (profDelErr) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete artist profile: ' + profDelErr.message },
          { status: 500 }
        );
      }

      await logAuditEvent({
        actorId: session.adminId || 'super-admin',
        action: 'artist_permanently_deleted',
        targetEntity: 'artist_profiles',
        targetId: artistProfileId,
        details: { deletedBy: session.name, timestamp: new Date().toISOString() },
      });

      return NextResponse.json({
        success: true,
        message: 'Artist profile, all nominations, and voting history permanently deleted.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid delete request' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error during permanent deletion.' },
      { status: 500 }
    );
  }
}
