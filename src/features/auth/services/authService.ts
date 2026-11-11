import { OtpRequestResult, OtpVerifyResult } from '../types';
import { normalizePhoneNumber } from './authUtils';
import { createClient } from '@/lib/supabase/browser';

/**
 * Requests a FREE Email OTP for voter verification (₹0 cost via Gmail SMTP / Brevo).
 */
export async function sendEmailOtp(email: string): Promise<OtpRequestResult> {
  try {
    const formattedEmail = email.trim().toLowerCase();

    const res = await fetch('/api/auth/email-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formattedEmail }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to send verification code. Please check your email and try again.',
      };
    }

    return {
      success: true,
      message: data.message || 'Verification code sent to your email.',
      cooldownSeconds: 60,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Verifies the 6-digit Email OTP and creates an authenticated voter session.
 */
export async function verifyEmailOtp(email: string, token: string): Promise<OtpVerifyResult> {
  try {
    const formattedEmail = email.trim().toLowerCase();

    const res = await fetch('/api/auth/email-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formattedEmail, otp: token }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Invalid or expired verification code. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Email verified successfully.',
      user: {
        id: data.user?.id || formattedEmail,
        phone: null,
        email: data.user?.email || formattedEmail,
        isVerified: true,
      },
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Verification failed';
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Initiates 1-click Google OAuth sign-in for voters when enabled.
 */
export async function signInVoterWithGoogle(nextPath = '/vote'): Promise<{ error?: string }> {
  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return {};
}

/**
 * Requests an SMS OTP for the given phone number using our dedicated SMS API.
 */
export async function sendOtp(phone: string): Promise<OtpRequestResult> {
  try {
    const formattedPhone = normalizePhoneNumber(phone).replace(/\D/g, '').slice(-10);

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to dispatch verification OTP. Please try again.',
      };
    }

    return {
      success: true,
      message: data.message || 'OTP dispatched to your mobile number via SMS.',
      cooldownSeconds: 60,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Verifies the 6-digit OTP using our dedicated OTP verification API.
 */
export async function verifyOtp(phone: string, token: string): Promise<OtpVerifyResult> {
  try {
    const formattedPhone = normalizePhoneNumber(phone).replace(/\D/g, '').slice(-10);

    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone, otp: token }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Invalid or expired OTP code. Please check and try again.',
      };
    }

    return {
      success: true,
      message: 'Mobile number verified successfully.',
      user: {
        id: formattedPhone,
        phone: `+91${formattedPhone}`,
        email: null,
        isVerified: true,
      },
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Verification failed';
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Signs the user out of all sessions.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}
