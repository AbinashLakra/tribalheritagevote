import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  ARTIST_COOKIE_NAME,
  ARTIST_SESSION_MAX_AGE_SEC,
  signArtistSession,
  hashArtistPassword,
} from '@/lib/auth/artist-session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Artist Name / Username / Mobile number and Password are required.' },
        { status: 400 }
      );
    }

    const cleanInput = String(username).trim();
    const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);
    const admin = createAdminClient();

    // 1. Look up artist by Phone, Stage Name, or Full Name
    let query = admin.from('artist_profiles').select('id, user_id, full_name, stage_name, phone, email');

    if (cleanDigits.length === 10) {
      query = query.or(`phone.eq.${cleanDigits},phone.eq.+91${cleanDigits}`);
    } else {
      query = query.or(`stage_name.ilike.%${cleanInput}%,full_name.ilike.%${cleanInput}%`);
    }

    const { data: matchedProfiles, error: searchError } = await query.limit(5);

    if (searchError) {
      console.error('Artist search error:', searchError);
      return NextResponse.json(
        { success: false, error: 'Error searching artist profile records.' },
        { status: 500 }
      );
    }

    if (!matchedProfiles || matchedProfiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No registered artist found matching "${cleanInput}". Please check the spelling of your Name or enter your 10-digit mobile number.`,
        },
        { status: 404 }
      );
    }

    const profile = matchedProfiles[0];
    const userPhone = profile.phone?.replace(/\D/g, '').slice(-10) || cleanDigits;
    const email = profile.email || `artist.${userPhone}@tribalheritage.org`;

    // 2. Verify password with Supabase Auth or stored hash
    let isAuthenticated = false;
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password.trim(),
    });

    if (!authError && authData.user) {
      isAuthenticated = true;
    } else {
      // Check backup password_hash from user_metadata
      const { data: userRecord } = await admin.auth.admin.getUserById(profile.user_id);
      const storedHash = userRecord?.user?.user_metadata?.password_hash;
      const computedHash = hashArtistPassword(password.trim());

      if (storedHash && storedHash === computedHash) {
        isAuthenticated = true;
        // Resync Supabase Auth password
        await admin.auth.admin.updateUserById(profile.user_id, {
          password: password.trim(),
        });
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect password. Please enter the password you created during your nomination registration.',
        },
        { status: 401 }
      );
    }

    // 3. Create signed session token for Artist
    const sessionToken = signArtistSession({
      artistProfileId: profile.id,
      userId: profile.user_id,
      stageName: profile.stage_name,
      fullName: profile.full_name,
      phone: userPhone,
      email,
      loginAt: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${profile.stage_name || profile.full_name}! Redirecting to your nomination status...`,
      artist: {
        id: profile.id,
        stageName: profile.stage_name,
        fullName: profile.full_name,
      },
    });

    // 4. Set HttpOnly session cookie
    response.cookies.set(ARTIST_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ARTIST_SESSION_MAX_AGE_SEC,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error during artist login';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
