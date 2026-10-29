import Link from 'next/link';
import { TreePine, User, Video, LayoutDashboard, Home } from 'lucide-react';

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-ivory-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-forest-700 flex items-center justify-center text-white shadow-sm">
                <TreePine className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-forest-900 leading-tight block">
                  Tribal Heritage Vote
                </span>
                <span className="text-[10px] uppercase font-semibold text-terracotta-600 tracking-wider block">
                  Artist Portal
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/artist/dashboard"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-charcoal-700 hover:text-forest-700 hover:bg-forest-50 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/artist/profile"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-charcoal-700 hover:text-forest-700 hover:bg-forest-50 transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                Artist Profile
              </Link>
              <Link
                href="/artist/nomination"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-charcoal-700 hover:text-forest-700 hover:bg-forest-50 transition-colors flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                Submit Nomination
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-charcoal-600 hover:text-forest-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ivory-300 hover:bg-ivory-100 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Back to Public Site
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

