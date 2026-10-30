'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Calendar,
  Video,
  History,
  Award,
  Home,
  LogOut,
  Users,
  CheckCircle2,
  Lock,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { AdminInactivityGuard } from './AdminInactivityGuard';

interface AdminPermissions {
  can_moderate_videos?: boolean;
  can_manage_contest?: boolean;
  can_view_audit_logs?: boolean;
  can_export_data?: boolean;
  can_view_analytics?: boolean;
  can_manage_admins?: boolean;
}

interface AdminSessionData {
  role: 'super_admin' | 'sub_admin';
  name: string;
  adminId: string;
  permissions: AdminPermissions;
}

export function AdminConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublicAuthPage =
    pathname === '/admin/login' || pathname === '/admin/request-access';

  const [session, setSession] = useState<AdminSessionData | null>(null);
  const [loading, setLoading] = useState(!isPublicAuthPage);

  useEffect(() => {
    if (isPublicAuthPage) {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/auth/session');
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.replace('/admin/login');
          return;
        }
        setSession(data.session);
      } catch {
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [pathname, isPublicAuthPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  };

  // If on login or request-access page, render standalone view without admin sidebar
  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/20 animate-pulse">
          <Shield className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-sm font-semibold text-blue-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          Verifying Admin Credentials &amp; Session...
        </p>
      </div>
    );
  }

  const perms = session?.permissions || {};
  const isSuperAdmin = session?.role === 'super_admin';

  return (
    <AdminInactivityGuard>
      <div className="min-h-screen bg-slate-50 flex">
        {/* ── Left Sidebar (Deep Royal Navy Blue) ── */}
        <aside className="w-64 bg-[#0a1c36] text-white flex flex-col justify-between hidden md:flex shrink-0 border-r border-blue-950">
          <div>
            {/* Brand Header */}
            <div className="h-16 px-5 border-b border-blue-900/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow">
                <Shield className="w-5 h-5 text-slate-950" />
              </div>
              <div className="overflow-hidden">
                <span className="font-extrabold text-xs block leading-tight text-white uppercase tracking-wider truncate">
                  Admin Console
                </span>
                <span className="text-[10px] text-blue-300 tracking-wider truncate block font-medium">
                  Tribal Heritage 2026
                </span>
              </div>
            </div>

            {/* Authenticated User Profile Badge */}
            <div className="p-4 mx-3 my-3 rounded-xl bg-blue-900/40 border border-blue-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Session" />
              </div>
              <p className="text-xs font-bold text-white truncate">
                {session?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-blue-300/80">
                Auto-logout on 15m inactivity
              </p>
            </div>

            {/* Navigation Links (Gated by Permissions) */}
            <nav className="px-3 space-y-1 text-xs font-semibold">
              {/* Executive Overview */}
              {(isSuperAdmin || perms.can_view_analytics) && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    pathname === '/admin'
                      ? 'bg-blue-800 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-300" />
                  <span>Executive Overview</span>
                </Link>
              )}

              {/* Staff Access Requests (Super Admin Only) */}
              {(isSuperAdmin || perms.can_manage_admins) && (
                <Link
                  href="/admin/access-requests"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    pathname === '/admin/access-requests'
                      ? 'bg-blue-800 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Staff Requests &amp; Roles</span>
                </Link>
              )}

              {/* Video Moderation */}
              {(isSuperAdmin || perms.can_moderate_videos) && (
                <Link
                  href="/admin/nominations"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    pathname === '/admin/nominations'
                      ? 'bg-blue-800 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Video className="w-4 h-4 text-blue-300" />
                  <span>Video Moderation</span>
                </Link>
              )}

              {/* Contest Lifecycle */}
              {(isSuperAdmin || perms.can_manage_contest) && (
                <Link
                  href="/admin/contest"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    pathname === '/admin/contest'
                      ? 'bg-blue-800 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-300" />
                  <span>Contest Lifecycle</span>
                </Link>
              )}

              {/* Audit Trail */}
              {(isSuperAdmin || perms.can_view_audit_logs) && (
                <Link
                  href="/admin/audit-logs"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    pathname === '/admin/audit-logs'
                      ? 'bg-blue-800 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4 text-blue-300" />
                  <span>Audit Trail</span>
                </Link>
              )}

              {/* Public Leaderboard */}
              <Link
                href="/leaderboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Live Leaderboard</span>
              </Link>
            </nav>
          </div>

          {/* Footer Actions in Sidebar */}
          <div className="p-3 border-t border-blue-900/60 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-blue-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Public Website</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-xs font-bold text-red-300 hover:text-white py-2 px-3 rounded-lg hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isSuperAdmin
                  ? 'Main Admin Console • Full Access'
                  : `Delegated Console • ${session?.name || 'Staff'}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Public Site
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminInactivityGuard>
  );
}
