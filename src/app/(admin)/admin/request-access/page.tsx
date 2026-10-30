'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Phone, Mail, User, FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function RequestAdminAccessPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roleCategory, setRoleCategory] = useState('video_reviewer');
  const [reason, setReason] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const detailedReason = `[${roleCategory.toUpperCase()}] ${reason.trim()}`;
      const res = await fetch('/api/admin/requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          reason: detailedReason,
          otp,
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
            Submit your credentials for review by the Main Platform Administrator
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Admin Access Request Submitted!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your mobile number has been verified. The Main Super Admin will review your application and assign feature permissions. Once approved, you will be able to log in immediately with your verified mobile number and OTP.
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{error}</span>
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

              {/* Mobile Number & OTP Verification */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Mobile Number (Indian Citizen)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!phone || phone.length < 10) {
                        setError('Please enter a valid 10-digit mobile number.');
                        return;
                      }
                      setOtpSent(true);
                      setOtp('123456');
                      setError(null);
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {otpSent ? 'Resend OTP' : 'Verify Mobile OTP'}
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
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Enter 6-Digit Phone Verification OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 123456"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {otpSent && (
                  <p className="text-[11px] text-blue-700">
                    ⚡ Test verification OTP: <strong>123456</strong>
                  </p>
                )}
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

              {/* Requested Role Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Requested Functional Role
                </label>
                <select
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="video_reviewer">Video Performance Reviewer (Jury)</option>
                  <option value="contest_coordinator">Contest Lifecycle Coordinator</option>
                  <option value="auditor">Voting Integrity &amp; Audit Inspector</option>
                  <option value="data_analyst">Results &amp; Analytics Officer</option>
                </select>
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
                  placeholder="Explain why you require admin console access and your role in the Rourkela event organization."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit Admin Access Request'}
                <ArrowRight className="w-4 h-4" />
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
