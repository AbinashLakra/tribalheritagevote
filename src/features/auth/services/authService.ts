import { OtpRequestResult, OtpVerifyResult } from '../types';
import { normalizePhoneNumber } from './authUtils';

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
