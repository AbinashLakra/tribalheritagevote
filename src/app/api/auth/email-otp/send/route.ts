import { NextRequest, NextResponse } from 'next/server';
import { getEmailGatewayDiagnostics, sendEmailOtp } from '@/lib/email/email-otp-service';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/request-validation';

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...getEmailGatewayDiagnostics(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const rate = checkRateLimit({
      key: `email_otp:${clientIp}:${email.trim().toLowerCase()}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const result = await sendEmailOtp(email);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      provider: result.provider,
      ...(result.codePreview ? { codePreview: result.codePreview } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send verification email.' },
      { status: 500 }
    );
  }
}

