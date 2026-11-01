import { NextRequest, NextResponse } from 'next/server';
import { cleanIndianPhone } from '@/lib/sms/sms-service';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
      return NextResponse.json({ isVerified: false });
    }

    const cleanPhone = cleanIndianPhone(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json({ isVerified: false });
    }

    const admin = createAdminClient();

    // 1. Check in artist_profiles
    const { data: artist } = await admin
      .from('artist_profiles')
      .select('id, is_phone_verified')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (artist && (artist.is_phone_verified || (artist as any).verification_status === 'verified')) {
      return NextResponse.json({ isVerified: true, source: 'artist_profile' });
    }

    // 2. Check in voter_identities
    const phoneHash = crypto
      .createHash('sha256')
      .update(`+91${cleanPhone}`)
      .digest('hex');

    const { data: voter } = await admin
      .from('voter_identities')
      .select('id, is_verified')
      .eq('phone_hash', phoneHash)
      .maybeSingle();

    if (voter && voter.is_verified) {
      return NextResponse.json({ isVerified: true, source: 'voter_identity' });
    }

    return NextResponse.json({ isVerified: false });
  } catch (err: any) {
    return NextResponse.json({ isVerified: false, error: err.message });
  }
}

