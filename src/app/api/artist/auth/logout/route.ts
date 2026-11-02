import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ARTIST_COOKIE_NAME } from '@/lib/auth/artist-session';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({
      success: true,
      message: 'Artist logged out successfully.',
    });

    response.cookies.set(ARTIST_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error during artist logout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
