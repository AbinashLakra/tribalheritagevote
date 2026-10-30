import { NextRequest, NextResponse } from 'next/server';
import { sendOtpToPhone } from '@/lib/sms/sms-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Mobile number is required to dispatch OTP.' },
        { status: 400 }
      );
    }

    const result = await sendOtpToPhone(phone);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      gateway: result.gateway,
      codePreview: result.codePreview, // available in sandbox/dev mode
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch SMS OTP.' },
      { status: 500 }
    );
  }
}
