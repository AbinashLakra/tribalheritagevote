import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/sms/sms-service';

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

    const result = await verifyOtpCode(phone, otp);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify OTP code.' },
      { status: 500 }
    );
  }
}

