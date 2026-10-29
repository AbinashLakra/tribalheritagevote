import Link from 'next/link';
import {
  TreePine,
  LayoutDashboard,
  Calendar,
  Video,
  ShieldCheck,
  History,
  Award,
  Home,
  LogOut,
  Users,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-charcoal-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-forest-950 text-white flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Brand */}
          <div className="h-16 px-6 border-b border-forest-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-terracotta-500 flex items-center justify-center text-white">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">Admin Console</span>
              <span className="text-[10px] uppercase font-semibold text-forest-400 tracking-wider">
                Tribal Heritage Vote
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ivory-200 hover:text-white hover:bg-forest-900 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-forest-400" />
              Executive Overview
            </Link>

            <Link
              href="/admin/contest"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ivory-200 hover:text-white hover:bg-forest-900 transition-colors"
            >
              <Calendar className="w-4 h-4 text-forest-400" />
              Contest Lifecycle
            </Link>

            <Link
              href="/admin/nominations"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ivory-200 hover:text-white hover:bg-forest-900 transition-colors"
            >
              <Video className="w-4 h-4 text-forest-400" />
              Video Moderation
            </Link>

            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ivory-200 hover:text-white hover:bg-forest-900 transition-colors"
            >
              <History className="w-4 h-4 text-forest-400" />
              Audit Trail
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ivory-200 hover:text-white hover:bg-forest-900 transition-colors"
            >
              <Award className="w-4 h-4 text-forest-400" />
              Public Leaderboard
            </Link>
          </nav>
        </div>

        {/* Footer in sidebar */}
        <div className="p-4 border-t border-forest-900">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-ivory-300 hover:text-white py-2 px-3 rounded-lg hover:bg-forest-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Public Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-ivory-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
              Authorized Committee Console
            </span>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-charcoal-600 hover:text-forest-700 md:hidden"
          >
            Public Site
          </Link>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

