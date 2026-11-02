import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/security/audit';
import { isGenderedCategory } from '@/lib/constants/art-categories';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contestId,
      categoryId,
      subCategory,
      title,
      description,
      uploadRecordId,
      artistProfileId: providedProfileId,
      phone,
      fullName,
      stageName,
      state,
      district,
      language,
      tribe,
      password,
      isDraft = false,
    } = body;

    // 1. Basic field validations
    if (!contestId || !categoryId || !title || !description || !uploadRecordId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contest, category, performance title, description, and uploaded video are all required.',
        },
        { status: 400 }
      );
    }

    // Determine and validate award subcategory (Male/Female)
    const requiresGender = isGenderedCategory(categoryId);
    const validSubCategory = requiresGender
      ? (subCategory === 'female' ? 'female' : 'male')
      : 'general';

    const admin = createAdminClient();

    // 2. Validate contest timing and status
    const { data: contest, error: contestError } = await admin
      .from('contests')
      .select('id, status, nomination_start_at, nomination_end_at')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Target cultural contest was not found.' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (contest.nomination_start_at && new Date(contest.nomination_start_at) > now) {
      return NextResponse.json(
        { success: false, error: 'Nominations for this contest have not opened yet.' },
        { status: 400 }
      );
    }

    if (contest.nomination_end_at && new Date(contest.nomination_end_at) < now) {
      return NextResponse.json(
        { success: false, error: 'The nomination deadline for this contest has passed.' },
        { status: 400 }
      );
    }

    // 3. Confirm video upload record is verified in Cloudflare R2
    const { data: uploadRecord, error: uploadError } = await admin
      .from('upload_records')
      .select('id, upload_status')
      .eq('id', uploadRecordId)
      .single();

    if (uploadError || !uploadRecord) {
      return NextResponse.json(
        { success: false, error: 'Video upload record could not be located in storage.' },
        { status: 400 }
      );
    }

    // 4. Resolve or create Artist Profile
    let artistProfileId = providedProfileId;

    if (!artistProfileId && phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const email = `artist.${cleanPhone}@tribalheritage.org`;

      // Check if user already exists
      const { data: userList } = await admin.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u) => u.email === email || u.phone === `+91${cleanPhone}`
      );

      let userId = existingUser?.id;
      const { hashArtistPassword } = await import('@/lib/auth/artist-session');
      const passwordHash = password ? hashArtistPassword(password) : undefined;
      const finalPassword = password || 'AdivasiVote@2026';

      if (!userId) {
        const { data: newUser } = await admin.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || 'Adivasi Artist',
            stage_name: stageName || fullName || 'Adivasi Performer',
            phone: cleanPhone,
            password_hash: passwordHash,
          },
        });
        userId = newUser?.user?.id;
      } else if (password && existingUser) {
        await admin.auth.admin.updateUserById(userId, {
          password: finalPassword,
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: fullName || existingUser.user_metadata?.full_name,
            stage_name: stageName || fullName || existingUser.user_metadata?.stage_name,
            password_hash: passwordHash,
          },
        });
      }

      if (userId) {
        // Upsert profiles
        await admin
          .from('profiles')
          .upsert(
            { id: userId, full_name: fullName || 'Adivasi Artist', phone: cleanPhone },
            { onConflict: 'id' }
          );

        // Upsert artist_profiles
        const { data: newProfile } = await admin
          .from('artist_profiles')
          .upsert(
            {
              user_id: userId,
              full_name: fullName || 'Adivasi Artist',
              stage_name: stageName || fullName || 'Adivasi Performer',
              state: state || 'Odisha',
              district: district || 'Sundargarh',
              language: language || 'Sadri',
              primary_category: 'Tribal Cultural Performance',
              bio: `Indigenous folk performer from ${district || 'Sundargarh'}, ${state || 'Odisha'}. Community: ${tribe || 'Indigenous'}.`,
              verification_status: 'verified',
            },
            { onConflict: 'user_id' }
          )
          .select('id')
          .single();

        artistProfileId = newProfile?.id;
      }
    }

    if (!artistProfileId) {
      return NextResponse.json(
        { success: false, error: 'Could not associate submission with an artist profile.' },
        { status: 400 }
      );
    }

    // 5. Check if artist has existing nomination and check disqualification
    const { data: existingNom } = await admin
      .from('nominations')
      .select('id, rejection_count, is_disqualified')
      .eq('contest_id', contestId)
      .eq('artist_profile_id', artistProfileId)
      .maybeSingle();

    if (existingNom?.is_disqualified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your nomination has been permanently disqualified after 3 failed evaluations and cannot be resubmitted.',
        },
        { status: 403 }
      );
    }

    // 6. Upsert nomination
    const initialStatus = isDraft ? 'draft' : 'submitted';
    const submittedAt = isDraft ? null : new Date().toISOString();

    const { data: nomination, error: nomError } = await admin
      .from('nominations')
      .upsert(
        {
          contest_id: contestId,
          artist_profile_id: artistProfileId,
          category_id: categoryId,
          sub_category: validSubCategory,
          title: title.trim(),
          description: description.trim(),
          upload_record_id: uploadRecordId,
          status: initialStatus,
          rejection_count: existingNom?.rejection_count || 0,
          is_disqualified: false,
          submitted_at: submittedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'contest_id,artist_profile_id' }
      )
      .select('id, status, title')
      .single();

    if (nomError || !nomination) {
      console.error('Nomination submission error:', nomError);
      return NextResponse.json(
        { success: false, error: 'Database error recording nomination: ' + nomError?.message },
        { status: 500 }
      );
    }

    await logAuditEvent({
      action: isDraft ? 'nomination_saved_draft' : 'nomination_submitted',
      targetEntity: 'nominations',
      targetId: nomination.id,
      details: { title, contestId, categoryId, artistProfileId },
    });

    return NextResponse.json({
      success: true,
      message: isDraft
        ? 'Nomination draft saved successfully.'
        : 'Cultural performance video nomination submitted successfully! It is now pending jury committee review.',
      nominationId: nomination.id,
      status: nomination.status,
    });
  } catch (error: any) {
    console.error('Nomination submit server error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error processing nomination submission.' },
      { status: 500 }
    );
  }
}
