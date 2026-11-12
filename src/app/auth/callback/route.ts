import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeEmail,
  upsertVerifiedEmailVoterIdentity,
} from '@/lib/email/email-otp-service';

/**
 * Handles Supabase OAuth callback redirects (e.g. Google Sign-In for voters),
 * activates the verified voter identity row, and redirects back to `/vote`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') || '/vote';
  const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/vote';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user?.email) {
      const normalizedEmail = normalizeEmail(data.user.email);
      const displayName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        normalizedEmail.split('@')[0];

      await upsertVerifiedEmailVoterIdentity(
        data.user.id,
        normalizedEmail,
        'GOOG',
        displayName
      );

      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/vote?authError=google_signin_failed`);
}

