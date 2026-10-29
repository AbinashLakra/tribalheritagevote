import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { artistProfileSchema } from '@/features/artists/schemas';
import { validateRequestBody } from '@/lib/security/request-validation';
import { logAuditEvent } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to manage your artist profile.' },
        { status: 401 }
      );
    }

    const validation = await validateRequestBody(request, artistProfileSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const {
      stageName,
      fullName,
      bio,
      state,
      district,
      language,
      primaryCategory,
      experienceYears,
      socialLinks,
    } = validation.data;

    const admin = createAdminClient();

    // Upsert artist profile
    const { data: profile, error: dbError } = await admin
      .from('artist_profiles')
      .upsert(
        {
          user_id: user.id,
          stage_name: stageName,
          full_name: fullName,
          bio,
          state,
          district,
          language,
          primary_category: primaryCategory,
          experience_years: experienceYears,
          social_links: socialLinks,
          verification_status: 'verified', // Verified upon completion of full details
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (dbError || !profile) {
      return NextResponse.json(
        { success: false, error: dbError?.message || 'Failed to save artist profile' },
        { status: 500 }
      );
    }

    // Assign 'artist' role in user_roles if not already present
    await admin
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: 'artist' },
        { onConflict: 'user_id,role' }
      );

    await logAuditEvent({
      actorId: user.id,
      action: 'artist_profile_updated',
      targetEntity: 'artist_profiles',
      targetId: profile.id,
      details: { stageName, state, district, primaryCategory },
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error processing profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

