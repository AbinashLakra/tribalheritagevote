import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyOtpCode, cleanIndianPhone } from '@/lib/sms/sms-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Mobile number and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = cleanIndianPhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // 1. Verify OTP against database / gateway
    const result = await verifyOtpCode(cleanPhone, otp);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    // 2. Provision or retrieve Supabase Auth User for this verified phone
    const email = `voter.${cleanPhone}@tribalheritage.org`;
    const admin = createAdminClient();

    const { data: userList } = await admin.auth.admin.listUsers();
    let existingUser = userList?.users?.find(
      (u) => u.email === email || u.phone === `+91${cleanPhone}`
    );

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          phone: cleanPhone,
          full_name: `Voter ${cleanPhone.slice(-4)}`,
          role: 'voter',
        },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { success: false, error: 'Failed to create voter identity: ' + createError?.message },
          { status: 500 }
        );
      }
      userId = newUser.user.id;
    }

    // 3. Ensure `profiles` record exists
    await admin.from('profiles').upsert(
      {
        id: userId,
        full_name: `Voter ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 4. Ensure `voter_identities` record exists with is_verified = TRUE
    const phoneHash = crypto
      .createHash('sha256')
      .update(`+91${cleanPhone}`)
      .digest('hex');

    await admin.from('voter_identities').upsert(
      {
        user_id: userId,
        phone_hash: phoneHash,
        phone_country_code: '+91',
        is_verified: true,
        verified_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // 5. Establish authenticated session cookies in browser
    const supabase = await createClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkData?.properties?.hashed_token) {
      await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'email',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully! Voter ballot activated.',
      user: {
        id: userId,
        phone: `+91${cleanPhone}`,
        isVerified: true,
      },
    });
  } catch (error: any) {
    console.error('OTP verify route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify OTP code.' },
      { status: 500 }
    );
  }
}
