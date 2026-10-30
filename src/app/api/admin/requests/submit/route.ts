import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyOtpCode } from '@/lib/sms/sms-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, email, reason, otp } = body;

    if (!full_name || !phone || !email || !reason) {
      return NextResponse.json(
        { success: false, error: 'Full name, phone, email, and purpose are all required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Verify OTP using SMS verification engine
    const otpCheck = await verifyOtpCode(cleanPhone, otp);
    if (!otpCheck.success) {
      return NextResponse.json(
        { success: false, error: otpCheck.message },
        { status: 400 }
      );
    }
    const admin = createAdminClient();

    // Check if phone already requested
    const { data: existing } = await admin
      .from('admin_access_requests')
      .select('id, status')
      .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({
          success: true,
          message: 'An access request for this mobile number is already PENDING review by the Main Admin.',
          status: 'pending',
        });
      }
      if (existing.status === 'approved') {
        return NextResponse.json({
          success: true,
          message: 'Your admin access is already APPROVED! You can now log in via the Sub-Admin login tab.',
          status: 'approved',
        });
      }
    }

    // Insert new request
    const { data: inserted, error: insertError } = await admin
      .from('admin_access_requests')
      .upsert(
        {
          full_name: full_name.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          reason: reason.trim(),
          status: 'pending',
          is_phone_verified: true,
          permissions: {
            can_moderate_videos: false,
            can_manage_contest: false,
            can_view_audit_logs: false,
            can_export_data: false,
            can_view_analytics: true,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      )
      .select()
      .single();

    if (insertError) {
      console.error('Failed to submit admin request:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to record request. ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin access request submitted successfully! Your mobile number is verified. The Main Admin will review and assign your permissions.',
      requestId: inserted.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error while submitting admin access request.' },
      { status: 500 }
    );
  }
}

