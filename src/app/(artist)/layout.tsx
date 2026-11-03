import Link from 'next/link';
import { Shield, Sparkles, Video, User, LayoutDashboard, Home, ArrowLeft } from 'lucide-react';

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col bg-grid-pattern">
      {/* Traditional Warli Dancing Ribbon Banner */}
      <div className="w-full bg-[#0a1c36] text-white border-b border-blue-950 py-1.5 px-4 text-center overflow-hidden">
        <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-blue-200 tracking-wider">
          <span>❖ DHARTI AABA VEER BIRSA MUNDA TRIBAL HERITAGE FESTIVAL 2026 ❖</span>
          <span className="hidden md:inline text-amber-400">• ROURKELA, SUNDARGARH, ODISHA •</span>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#0f2d59] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="font-extrabold text-base text-[#0f2d59] leading-tight block uppercase tracking-wide">
                  Tribal Heritage
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                  Artist Nomination Portal
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/artist/nomination"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0f2d59] bg-blue-50 border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-blue-700" />
                <span>Submit Video Nomination</span>
              </Link>
              <Link
                href="/artist/nomination/status"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <span>Track Status</span>
              </Link>
              <Link
                href="/artist/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <span>Artist Login</span>
              </Link>
              <Link
                href="/artists"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <span>National Showcase</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="text-[11px] sm:text-xs font-bold text-slate-700 hover:text-[#0f2d59] flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Public Website</span>
              <span className="sm:hidden">Website</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Tribal Heritage Organizer Committee • Dharti Aaba Veer Birsa Munda 151st Jayanti • Rourkela, Sundargarh, Odisha</p>
      </footer>
    </div>
  );
}
