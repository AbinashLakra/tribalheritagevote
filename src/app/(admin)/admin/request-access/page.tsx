'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  Clock,
  Send,
  Check,
  Crown,
  Lock,
} from 'lucide-react';
import { ROLE_PRESETS, RoleCategoryKey } from '@/lib/auth/admin-constants';

const ADMIN_POSITION_OPTIONS: {
  key: RoleCategoryKey;
  label: string;
  badge: string;
  subtitle: string;
}[] = [
  {
    key: 'main_admin',
    label: '👑 Main Admin (Second Main Admin - All Access)',
    badge: 'Second Main Admin',
    subtitle: 'All platform access, review all 8 categories, supervise & shift 4 Sub-Admins, delete/unapprove nominations, and manage voting schedule.',
  },
  {
    key: 'panel_admin_1',
    label: '🎬 Admin 1: Panel 1 (Music Video & Lead Dance - Cat 1 & 2)',
    badge: 'Admin 1 (Panel 1)',
    subtitle: 'Review & approve audition videos for Best Music Video (Nagpuri) & Best Dance in Video.',
  },
  {
    key: 'panel_admin_2',
    label: '🎭 Admin 2: Panel 2 (Leading Actor & Lead Singer - Cat 3 & 4)',
    badge: 'Admin 2 (Panel 2)',
    subtitle: 'Review & approve audition videos for Best Actor in a Leading Role & Best Singer.',
  },
  {
    key: 'panel_admin_3',
    label: '🎥 Admin 3: Panel 3 (Cinematographer & Director - Cat 5 & 6)',
    badge: 'Admin 3 (Panel 3)',
    subtitle: 'Review & approve audition videos for Best Cinematographer / Camera Person & Best Director.',
  },
  {
    key: 'panel_admin_4',
    label: '🎵 Admin 4: Panel 4 (Choreographer & Music Director - Cat 7 & 8)',
    badge: 'Admin 4 (Panel 4)',
    subtitle: 'Review & approve audition videos for Best Choreographer & Best Music Director.',
  },
];

export default function RequestAdminAccessPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roleCategory, setRoleCategory] = useState<RoleCategoryKey>('main_admin');
  const [reason, setReason] = useState('');

  // Slot status
  const [slotStatus, setSlotStatus] = useState<{
    filledSlots: Record<string, boolean>;
    totalFilled: number;
    allFilled: boolean;
  }>({
    filledSlots: {},
    totalFilled: 0,
    allFilled: false,
  });
  const [loadingSlots, setLoadingSlots] = useState(true);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch slot status on mount
  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await fetch('/api/admin/requests/slots');
        const data = await res.json();
        if (data.success && data.data) {
          setSlotStatus(data.data);
          // If default selected role is filled, select the first available slot
          if (data.data.filledSlots['main_admin']) {
            const available = ADMIN_POSITION_OPTIONS.find(
              (pos) => !data.data.filledSlots[pos.key]
            );
            if (available) {
              setRoleCategory(available.key);
            }
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Dispatch OTP via SMS to requester's phone
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setSendingOtp(true);
    setError(null);
    setOtpNotice(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification OTP.');
      }

      setOtpSent(true);
      setCooldown(60);

      if (data.codePreview) {
        setOtpNotice(`OTP generated for +91 ${cleanPhone}. Verification Code: ${data.codePreview} (Valid for 5 min).`);
      } else {
        setOtpNotice(`SMS OTP dispatched to +91 ${cleanPhone}. Please enter the 6 digits received on your phone.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error sending OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (slotStatus.allFilled) {
      setError('All 5 Administrator positions are already approved and filled. Applications are closed.');
      return;
    }

    if (slotStatus.filledSlots[roleCategory]) {
      setError('This admin position has already been assigned and approved. Please select another available position.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!otpSent) {
      setError('Please click "Send OTP via SMS" to verify your mobile number first.');
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification OTP received on your mobile.');
      return;
    }

    setLoading(true);

    try {
      const selectedPreset = ROLE_PRESETS[roleCategory] || ROLE_PRESETS.panel_admin_1;
      const detailedReason = `[${selectedPreset.badge.toUpperCase()}] ${reason.trim()}`;

      const res = await fetch('/api/admin/requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          role_category: roleCategory,
          reason: detailedReason,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit access request.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPreset = ROLE_PRESETS[roleCategory] || ROLE_PRESETS.panel_admin_1;
  const isSelectedSlotFilled = Boolean(slotStatus.filledSlots[roleCategory]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 bg-grid-pattern relative">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0f2d59] p-6 text-white text-center space-y-2 border-b border-blue-950">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/20 shadow-inner">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-extrabold uppercase tracking-wider">
            Request Admin Privileges
          </h1>
          <p className="text-xs text-blue-200">
            Submit your credentials for review &amp; role approval by the Main Super Administrator
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Capacity / Slot Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              <span className="font-bold text-slate-800">Admin Position Slots:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-900">
                {slotStatus.totalFilled} / 5 Approved
              </span>
              {slotStatus.allFilled ? (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-extrabold text-[10px]">
                  ALL FILLED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  {5 - slotStatus.totalFilled} AVAILABLE
                </span>
              )}
            </div>
          </div>

          {/* Lockdown Banner when all 5 spots are filled */}
          {slotStatus.allFilled && !submitted && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-sm text-red-800">
                <Lock className="w-4 h-4 text-red-600" />
                <span>Admin Request Portal Locked</span>
              </div>
              <p className="text-xs leading-relaxed text-red-700">
                All 5 official administrator positions (1 Second Main Admin and 4 Panel Category Admins) have already been approved and assigned. No further applications can be accepted at this time.
              </p>
              <div className="pt-1">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 hover:text-red-950 underline"
                >
                  Return to Admin Login &rarr;
                </Link>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Admin Access Request Submitted!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your mobile number <strong>+91 {phone.slice(-10)}</strong> has been verified via SMS OTP for{' '}
                <strong className="text-blue-900">{currentPreset.label}</strong>. Once approved by the Main Super Administrator or Second Main Admin, you will be able to log in immediately via the Delegated Sub-Admin tab.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  href="/admin/login"
                  className="px-6 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow"
                >
                  Return to Admin Login
                </Link>
              </div>
            </div>
          ) : !slotStatus.allFilled && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {otpNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{otpNotice}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your official name"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Mobile Number & Dedicated OTP Dispatch */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Mobile Number (Indian Citizen)
                  </label>
                  <button
                    type="button"
                    disabled={sendingOtp || cooldown > 0 || phone.replace(/\D/g, '').length < 10}
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {sendingOtp ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Sending SMS...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Resend in {cooldown}s</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>{otpSent ? 'Resend OTP via SMS' : 'Send OTP via SMS'}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-600 flex items-center">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError(null);
                    }}
                    placeholder="9876543210"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* OTP Input Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Enter 6-Digit Phone Verification OTP
                  </label>
                  {otpSent && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SMS dispatched
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={otpSent ? 'Enter 6-digit OTP received' : 'Click "Send OTP via SMS" above first'}
                  disabled={!otpSent}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Official Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Official Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.org"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Requested Functional Role Dropdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Select Desired Admin Position
                  </label>
                  {roleCategory === 'main_admin' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-600" />
                      Second Main Admin
                    </span>
                  )}
                </div>
                
                <select
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value as RoleCategoryKey)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {ADMIN_POSITION_OPTIONS.map((pos) => {
                    const isFilled = Boolean(slotStatus.filledSlots[pos.key]);
                    return (
                      <option
                        key={pos.key}
                        value={pos.key}
                        disabled={isFilled}
                        className={isFilled ? 'text-slate-400 bg-slate-100' : 'text-slate-900'}
                      >
                        {isFilled ? `🔒 [FILLED] ${pos.label}` : pos.label}
                      </option>
                    );
                  })}
                </select>

                {/* Scope Preview Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1.5">
                  <div className="font-bold flex items-center justify-between gap-1.5 text-[#0f2d59]">
                    <span>Scope: {currentPreset.badge}</span>
                    {isSelectedSlotFilled ? (
                      <span className="text-[10px] font-extrabold text-red-600 uppercase">
                        Position Already Assigned
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase">
                        Position Open
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    {currentPreset.description}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {Object.entries(currentPreset.permissions).map(([key, val]) => {
                      if (!val) return null;
                      const niceName = key
                        .replace('can_', '')
                        .replace('_', ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[10px] font-semibold text-blue-900"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          {niceName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Purpose / Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Purpose &amp; Committee Affiliation
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you require admin access, which jury committee or role you serve, and why this scope is requested."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !otpSent || otp.length !== 6 || isSelectedSlotFilled || slotStatus.allFilled}
                className="w-full py-3 px-4 rounded-xl bg-[#0f2d59] hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP &amp; Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Admin Access Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link href="/admin/login" className="text-xs font-bold text-blue-700 hover:underline">
              &larr; Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
