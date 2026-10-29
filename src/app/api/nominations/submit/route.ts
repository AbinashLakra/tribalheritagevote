import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';

const nominationSubmissionSchema = z.object({
  contestId: z.string().uuid('Invalid contest ID'),
  categoryId: z.string().uuid('Invalid category ID'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(3000),
  uploadRecordId: z.string().uuid('A verified video upload is required'),
  isDraft: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to submit a nomination.' },
        { status: 401 }
      );
    }

    const validation = await validateRequestBody(request, nominationSubmissionSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { contestId, categoryId, title, description, uploadRecordId, isDraft } = validation.data;
    const admin = createAdminClient();

    // 1. Fetch artist profile
    const { data: artistProfile, error: profileError } = await admin
      .from('artist_profiles')
      .select('id, full_name, stage_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !artistProfile) {
      return NextResponse.json(
        { success: false, error: 'Please complete your artist profile before submitting a nomination.' },
        { status: 404 }
      );
    }

    // 2. Validate contest timing and status
    const { data: contest, error: contestError } = await admin
      .from('contests')
      .select('id, status, nomination_start_at, nomination_end_at')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (new Date(contest.nomination_start_at) > now) {
      return NextResponse.json(
        { success: false, error: 'Nominations for this contest have not opened yet.' },
        { status: 400 }
      );
    }

    if (new Date(contest.nomination_end_at) < now) {
      return NextResponse.json(
        { success: false, error: 'Nomination period for this contest has ended.' },
        { status: 400 }
      );
    }

    // 3. Confirm video upload record is verified
    const { data: uploadRecord, error: uploadError } = await admin
      .from('upload_records')
      .select('id, upload_status')
      .eq('id', uploadRecordId)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !uploadRecord || uploadRecord.upload_status !== 'verified') {
      return NextResponse.json(
        { success: false, error: 'Video upload must be completed and verified before submission.' },
        { status: 400 }
      );
    }

    // 4. Upsert nomination (one nomination per artist per contest)
    const initialStatus = isDraft ? 'draft' : 'submitted';
    const submittedAt = isDraft ? null : new Date().toISOString();

    const { data: nomination, error: insertError } = await admin
      .from('nominations')
      .upsert(
        {
          contest_id: contestId,
          artist_profile_id: artistProfile.id,
          category_id: categoryId,
          title,
          description,
          upload_record_id: uploadRecordId,
          status: initialStatus,
          submitted_at: submittedAt,
        },
        { onConflict: 'contest_id,artist_profile_id' }
      )
      .select('id, status, title')
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message || 'Failed to submit nomination.' },
        { status: 500 }
      );
    }

    // 5. Audit log
    await logAuditEvent({
      actorId: user.id,
      action: isDraft ? 'nomination_saved_draft' : 'nomination_submitted',
      targetEntity: 'nominations',
      targetId: nomination.id,
      details: { title, contestId, categoryId },
    });

    return NextResponse.json({
      success: true,
      data: nomination,
      message: isDraft
        ? 'Nomination saved as draft successfully.'
        : 'Nomination submitted successfully! Our cultural moderation committee will review your video.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Nomination submission failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
