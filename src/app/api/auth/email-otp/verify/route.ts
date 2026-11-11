import { NextRequest, NextResponse } from 'next/server';
import {
  isValidEmail,
  normalizeEmail,
  signInAndProvisionEmailVoter,
  verifyEmailOtp,
} from '@/lib/email/email-otp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email address and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(String(email));
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const verifyResult = await verifyEmailOtp(cleanEmail, String(otp));
    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.message },
        { status: 400 }
      );
    }

    const sessionResult = await signInAndProvisionEmailVoter(cleanEmail);
    if (!sessionResult.success || !sessionResult.userId) {
      return NextResponse.json(
        { success: false, error: sessionResult.error || 'Failed to create voter session.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your voting ballot is ready.',
      user: {
        id: sessionResult.userId,
        phone: null,
        email: sessionResult.email || cleanEmail,
        isVerified: true,
      },
    });
  } catch (error: any) {
    console.error('Email OTP verify error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to verify code.' },
      { status: 500 }
    );
  }
}
