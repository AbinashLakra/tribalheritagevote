'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, KeyRound, Phone, ArrowRight, Lock, CheckCircle2, AlertCircle, Sparkles, UserCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [activeTab, setActiveTab] = useState<'super_admin' | 'sub_admin'>('super_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Super Admin form
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');

  // Sub Admin form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'super_admin', username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please verify master password.');
      }

      setSuccess('Super Admin authenticated! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sub_admin', phone, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sub-Admin authentication failed.');
      }

      setSuccess(`Welcome ${data.session?.name || 'Admin'}! Loading your assigned permissions...`);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 bg-grid-pattern relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="bg-[#0f2d59] p-6 text-white text-center space-y-2 border-b border-blue-950">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/20 shadow-inner">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-extrabold uppercase tracking-wider">
            Admin Console Portal
          </h1>
          <p className="text-xs text-blue-200">
            Tribal Heritage Vote 2026 • Rourkela, Sundargarh, Odisha
          </p>
        </div>

        {/* Reason / Notice alert */}
        {reason === 'inactivity' && (
          <div className="bg-amber-50 border-b border-amber-200 p-3.5 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>You were automatically logged out after 15 minutes of inactivity for security.</span>
          </div>
        )}

        {/* Dual Tab Selector */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('super_admin');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'super_admin'
                ? 'bg-white text-[#0f2d59] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Main Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sub_admin');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sub_admin'
                ? 'bg-white text-[#0f2d59] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-blue-700" />
            <span>Delegated Sub-Admin</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* ──────────────── TAB 1: SUPER ADMIN LOGIN ──────────────── */}
          {activeTab === 'super_admin' && (
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Constant Master Password
                  </label>
                  <span className="text-[10px] text-slate-400">Persistent Admin Key</span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                🛡️ Super Admin holds unrestricted system privileges across contest timelines, full video approvals, user role delegations, and audit ledgers.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In as Super Admin'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ──────────────── TAB 2: SUB ADMIN LOGIN (PHONE + OTP) ──────────────── */}
          {activeTab === 'sub_admin' && (
            <form onSubmit={handleSubAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Approved Mobile Number
                </label>
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Verification OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!phone || phone.length < 10) {
                        setError('Please enter a 10-digit mobile number first.');
                        return;
                      }
                      setOtpSent(true);
                      setOtp('123456');
                      setError(null);
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {otpSent ? 'Resend OTP' : 'Send Test OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP (123456)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {otpSent && (
                <div className="p-2.5 rounded-lg bg-blue-50 text-[11px] text-blue-800">
                  ⚡ Test OTP auto-filled: <strong>123456</strong>. (Access must be approved by Main Admin).
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign In with OTP'}
                <UserCheck className="w-4 h-4 text-amber-200" />
              </button>
            </form>
          )}

          {/* Bottom Card: Request Admin Access Link */}
          <div className="pt-4 border-t border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600">
              Need administrator or reviewer access for your committee?
            </p>
            <Link
              href="/admin/request-access"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
            >
              <span>Submit Admin Access Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
              &larr; Return to Public Website
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

