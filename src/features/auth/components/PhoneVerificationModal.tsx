'use client';

import React, { useState } from 'react';
import { X, Mail, Smartphone, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { emailSchema, phoneSchema } from '../schemas';
import {
  sendEmailOtp,
  verifyEmailOtp,
  sendOtp,
  verifyOtp,
  signInVoterWithGoogle,
} from '../services/authService';
import { OtpInputForm } from './OtpInputForm';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; phone: string | null; email?: string | null }) => void;
  title?: string;
  description?: string;
}

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
const SMS_VOTER_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_SMS_VOTER_LOGIN === 'true';

export function PhoneVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verify Your Email to Vote',
  description = 'Enter your email address to receive a free 6-digit verification code. Strictly one fair vote per citizen.',
}: PhoneVerificationModalProps) {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const nextPath =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/vote';
      const result = await signInVoterWithGoogle(nextPath);
      if (result.error) {
        setError(result.error);
        setIsGoogleLoading(false);
      }
    } catch {
      setError('Unable to start Google sign-in. Please use email verification below.');
      setIsGoogleLoading(false);
    }
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'email') {
      const validation = emailSchema.safeParse(email);
      if (!validation.success) {
        setError(validation.error.issues[0]?.message || 'Please enter a valid email address.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await sendEmailOtp(validation.data);
        if (result.success) {
          setEmail(validation.data);
          setStep('otp');
        } else {
          setError(result.message);
        }
      } catch {
        setError('Failed to send verification email. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const validation = phoneSchema.safeParse(phone);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOtp(phone);
      if (result.success) {
        setStep('otp');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to send verification code. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (token: string) => {
    if (mode === 'email') {
      const result = await verifyEmailOtp(email, token);
      if (result.success && result.user) {
        onSuccess({ id: result.user.id, phone: null, email: result.user.email });
        onClose();
        return { success: true, message: 'Verified' };
      }
      return { success: false, message: result.message };
    }

    const result = await verifyOtp(phone, token);
    if (result.success && result.user) {
      onSuccess({ id: result.user.id, phone: result.user.phone, email: result.user.email });
      onClose();
      return { success: true, message: 'Verified' };
    }
    return { success: false, message: result.message };
  };

  const handleResendOtp = async () => {
    return mode === 'email' ? await sendEmailOtp(email) : await sendOtp(phone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-ivory-200 overflow-hidden">
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-forest-600 via-terracotta-500 to-forest-700" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-charcoal-400 hover:text-charcoal-700 rounded-full hover:bg-ivory-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {step === 'input' ? (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-forest-700">
                  {mode === 'email' ? <Mail className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-charcoal-900">{title}</h3>
                <p className="text-sm text-charcoal-600">{description}</p>
              </div>

              {GOOGLE_AUTH_ENABLED && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    <span>{isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-ivory-300 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-charcoal-400 shrink-0">
                      or verify via Email OTP
                    </span>
                    <div className="border-t border-ivory-300 w-full" />
                  </div>
                </>
              )}

              {SMS_VOTER_ALLOWED && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-ivory-100 rounded-xl border border-ivory-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('email');
                      setError(null);
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      mode === 'email' ? 'bg-white text-forest-800 shadow-xs' : 'text-charcoal-600'
                    }`}
                  >
                    Email OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('phone');
                      setError(null);
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      mode === 'phone' ? 'bg-white text-forest-800 shadow-xs' : 'text-charcoal-600'
                    }`}
                  >
                    Mobile OTP
                  </button>
                </div>
              )}

              <form onSubmit={handleInputSubmit} className="space-y-4">
                {mode === 'email' ? (
                  <div>
                    <label
                      htmlFor="voter-email-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="voter-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="you@gmail.com"
                      autoFocus
                      required
                      className="block w-full rounded-lg border border-ivory-300 bg-white px-3.5 py-2.5 text-charcoal-900 placeholder-charcoal-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-base font-medium transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="mobile-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
                    >
                      Mobile Number
                    </label>
                    <div className="relative flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-ivory-300 bg-ivory-100 text-charcoal-700 font-semibold text-sm">
                        🇮🇳 +91
                      </span>
                      <input
                        id="mobile-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setError(null);
                        }}
                        placeholder="98765 43210"
                        maxLength={10}
                        autoFocus
                        className="flex-1 block w-full rounded-none rounded-r-lg border border-ivory-300 bg-white px-3.5 py-2.5 text-charcoal-900 placeholder-charcoal-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-base font-medium transition-all"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg text-terracotta-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={(mode === 'email' ? !email.trim() : phone.length < 10) || isLoading}
                  className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : mode === 'email' ? (
                    'Get Verification Code via Email'
                  ) : (
                    'Get OTP via SMS'
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-ivory-200">
                <div className="flex items-center gap-2 text-xs text-charcoal-500">
                  <ShieldCheck className="w-4 h-4 text-forest-600 shrink-0" />
                  <span>
                    Your email is private and never shared. Strictly one fair vote per verified voter.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <OtpInputForm
              phone={mode === 'email' ? email : `+91 ${phone}`}
              backLabel={mode === 'email' ? 'Change email' : 'Change number'}
              onVerify={handleOtpVerify}
              onBack={() => setStep('input')}
              onResend={handleResendOtp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
