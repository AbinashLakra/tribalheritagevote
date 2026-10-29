'use client';

import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { phoneSchema } from '../schemas';
import { sendOtp, verifyOtp } from '../services/authService';
import { OtpInputForm } from './OtpInputForm';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; phone: string | null }) => void;
  title?: string;
  description?: string;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verify Your Mobile to Vote',
  description = 'To guarantee one fair vote per citizen, please verify your Indian mobile number via OTP.',
}: PhoneVerificationModalProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = phoneSchema.safeParse(phone);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setError(issue?.message || 'Please enter a valid 10-digit mobile number');
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
    const result = await verifyOtp(phone, token);
    if (result.success && result.user) {
      onSuccess({ id: result.user.id, phone: result.user.phone });
      onClose();
      return { success: true, message: 'Verified' };
    }
    return { success: false, message: result.message };
  };

  const handleResendOtp = async () => {
    return await sendOtp(phone);
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
          {step === 'phone' ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-forest-700">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900">{title}</h3>
                <p className="text-sm text-charcoal-600">{description}</p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label htmlFor="mobile-input" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
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

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg text-terracotta-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={phone.length < 10 || isLoading}
                  className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Get OTP via SMS'
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-ivory-200">
                <div className="flex items-center gap-2 text-xs text-charcoal-500">
                  <ShieldCheck className="w-4 h-4 text-forest-600 shrink-0" />
                  <span>
                    Your number is encrypted and never shared. Strictly one vote per verified phone.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <OtpInputForm
              phone={`+91 ${phone}`}
              onVerify={handleOtpVerify}
              onBack={() => setStep('phone')}
              onResend={handleResendOtp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
