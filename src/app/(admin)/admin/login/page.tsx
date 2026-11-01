'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Mail,
  Phone,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [activeTab, setActiveTab] = useState<'super_admin' | 'sub_admin'>('super_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Super Admin form
  const [superUsername, setSuperUsername] = useState('Admin');
  const [superPassword, setSuperPassword] = useState('');

  // Sub Admin / Panel Admin form
  const [subEmail, setSubEmail] = useState('');
  const [subPassword, setSubPassword] = useState('');

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'super_admin',
          username: superUsername.trim(),
          password: superPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please verify Super Admin credentials.');
      }

      setSuccess('Super Admin authenticated! Redirecting to master executive console...');
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Super Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanEmail = subEmail.trim();
    const cleanPhone = subPassword.replace(/\D/g, '').slice(-10);

    if (!cleanEmail) {
      setError('Please enter your approved Email ID.');
      setLoading(false);
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Password must be your registered 10-digit mobile number.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sub_admin',
          email: cleanEmail,
          password: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sub-admin authentication failed.');
      }

      setSuccess(`Authenticated successfully as ${data.session?.name || 'Admin'}! Loading dashboard...`);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        {/* Brand Shield Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f2d59] border-2 border-amber-400/50 shadow-xl mb-4">
          <Shield className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Admin Governance Console
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-blue-200">
          Dharti Aaba Veer Birsa Munda Cultural &amp; Film Awards 2026
        </p>

        {/* Inactivity Logout Notice */}
        {reason === 'inactivity' && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You were automatically logged out due to 15 minutes of inactivity.</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Dual-Role Selector Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('super_admin');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'super_admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Main Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sub_admin');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sub_admin'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Panel / Sub-Admin</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{success}</p>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: MAIN SUPER ADMIN FORM
              Username: Admin
              Password: Admin@6789$
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'super_admin' && (
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Super Admin Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={superUsername}
                    onChange={(e) => setSuperUsername(e.target.value)}
                    required
                    className="w-full pl-3 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    placeholder="Admin"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Master Password
                  </label>
                  <span className="text-[10px] text-amber-400/90 font-medium">
                    Constant Password
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={superPassword}
                    onChange={(e) => setSuperPassword(e.target.value)}
                    required
                    className="w-full pl-3 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors tracking-wider"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Master Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login as Main Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Super Admin Capabilities:</p>
                <p>• Full platform operational and backend access</p>
                <p>• Approve, reject, or reassign all 4 Sub-Admin Category Panels</p>
                <p>• Permanently delete any artist, nomination, or admin from the database</p>
                <p>• Set contest dates, durations, and publish live results</p>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: SUB-ADMIN / PANEL ADMIN / CO-ADMIN FORM
              Username: Email ID
              Password: Phone Number (No OTP required)
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'sub_admin' && (
            <form onSubmit={handleSubAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Sub-Admin Username (Registered Email ID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="your-name@tribalheritage.org"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Password (Registered 10-Digit Mobile Number)
                  </label>
                  <span className="text-[10px] text-blue-400 font-medium">
                    No OTP Required
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={subPassword}
                    onChange={(e) => setSubPassword(e.target.value)}
                    required
                    maxLength={14}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors tracking-widest"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Panel Admin Account...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login to Assigned Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Category Panels Assigned by Main Admin:</p>
                <p>• <strong>Panel 1:</strong> Best Music Video (Nagpuri) &amp; Best Dance in Video</p>
                <p>• <strong>Panel 2:</strong> Best Actor in a Leading Role &amp; Best Singer</p>
                <p>• <strong>Panel 3:</strong> Best Cinematographer / Camera Person &amp; Best Director</p>
                <p>• <strong>Panel 4:</strong> Best Choreographer &amp; Best Music Director</p>
              </div>

              {/* Request Access link */}
              <div className="pt-2 text-center border-t border-slate-700/60">
                <p className="text-xs text-slate-400">
                  Need jury or moderation access?{' '}
                  <Link
                    href="/admin/request-access"
                    className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    Submit Admin Access Request
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Back to public portal */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Return to Public Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
