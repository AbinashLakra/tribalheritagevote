'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

interface OtpInputFormProps {
  phone: string;
  onVerify: (otp: string) => Promise<{ success: boolean; message: string }>;
  onBack: () => void;
  onResend: () => Promise<{ success: boolean; message: string }>;
  backLabel?: string;
}

export function OtpInputForm({
  phone,
  onVerify,
  onBack,
  onResend,
  backLabel = 'Change number',
}: OtpInputFormProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleSubmitOtp(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    if (pastedData.length === 6) {
      handleSubmitOtp(pastedData);
    } else {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleSubmitOtp = async (code: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onVerify(code);
      if (!result.success) {
        setError(result.message);
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const result = await onResend();
      if (result.success) {
        setCooldown(60);
      } else {
        setError(result.message);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-forest-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-charcoal-900">Enter Verification Code</h3>
        <p className="text-sm text-charcoal-600">
          We sent a 6-digit verification code to{' '}
          <span className="font-semibold text-charcoal-800">{phone}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={isSubmitting}
            className="w-11 h-14 text-center text-2xl font-bold rounded-lg border-2 border-ivory-300 bg-white text-charcoal-900 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 transition-all outline-none"
          />
        ))}
      </div>

      {error && (
        <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg text-terracotta-700 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 text-sm text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || isResending || isSubmitting}
          className="inline-flex items-center gap-1.5 text-sm text-forest-700 hover:text-forest-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isResending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => handleSubmitOtp(otp.join(''))}
        disabled={otp.join('').length !== 6 || isSubmitting}
        className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying Code...
          </>
        ) : (
          'Verify & Continue to Vote'
        )}
      </button>
    </div>
  );
}
