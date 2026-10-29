import { createClient } from '@/lib/supabase/browser';
import { normalizePhoneNumber } from './authUtils';
import { OtpRequestResult, OtpVerifyResult } from '../types';

/**
 * Requests an SMS OTP for the given phone number using Supabase Auth.
 */
export async function sendOtp(phone: string): Promise<OtpRequestResult> {
  try {
    const supabase = createClient();
    const formattedPhone = normalizePhoneNumber(phone);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP. Please check the number and try again.',
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully to your mobile number.',
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
 * Verifies the 6-digit OTP and establishes an authenticated session.
 */
export async function verifyOtp(phone: string, token: string): Promise<OtpVerifyResult> {
  try {
    const supabase = createClient();
    const formattedPhone = normalizePhoneNumber(phone);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    if (error || !data.user) {
      return {
        success: false,
        message: error?.message || 'Invalid or expired OTP. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Mobile number verified successfully.',
      user: {
        id: data.user.id,
        phone: data.user.phone || null,
        email: data.user.email || null,
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
  const supabase = createClient();
  await supabase.auth.signOut();
}
