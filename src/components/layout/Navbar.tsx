"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Users, Shield, Sparkles, Menu, X, Award, Vote } from "lucide-react";
import { TribalRibbonBorder } from "@/components/shared/TribalRibbonBorder";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* ── Main Blue Header Bar ── */}
      <div className="bg-[#0f2d59] text-white border-b border-blue-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02]"
            aria-label="Tribal Heritage 2026"
          >
            {/* Circular Tribal Badge */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1b2e23] border-2 border-amber-400 shadow-inner">
              <span className="text-xs font-bold text-amber-300">TH</span>
              <div className="absolute inset-0 rounded-full border border-amber-400/40 animate-pulse" />
            </div>

            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
                TRIBAL HERITAGE 2026
              </span>
              <span className="text-[10px] text-blue-200 tracking-wider -mt-1 font-medium hidden sm:inline">
                ROURKELA, ODISHA • ALL-INDIA ADIVASI PLATFORM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Buttons */}
          <nav className="hidden items-center gap-2 sm:gap-3 md:flex" aria-label="Main">
            {/* Home */}
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all border ${
                pathname === "/"
                  ? "bg-white/20 border-white/40 text-white"
                  : "border-transparent hover:bg-white/10 text-blue-100 hover:text-white"
              }`}
            >
              <Home className="h-4 w-4 text-blue-200" />
              <span>Home</span>
            </Link>

            {/* Delegate / Voter Portal (Gold button from screenshot) */}
            <Link
              href="/artists"
              className="flex items-center gap-1.5 rounded-lg bg-[#b45309] hover:bg-[#92400e] text-white px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow transition-all border border-amber-500/40"
            >
              <Vote className="h-4 w-4 text-amber-200" />
              <span>Delegate / Vote</span>
            </Link>

            {/* Admin Portal (Navy Dark button from screenshot) */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all border border-slate-700 shadow"
            >
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Admin</span>
            </Link>

            {/* Register / Nominate (White Pill button with Sparkle from screenshot) */}
            <Link
              href="/artist/nomination"
              className="flex items-center gap-1.5 rounded-full bg-white hover:bg-blue-50 text-[#0f2d59] px-4 py-1.5 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Register</span>
            </Link>
          </nav>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Cultural Ribbon Border (Under Navbar) ── */}
      <TribalRibbonBorder variant="light" />

      {/* ── Mobile Dropdown Menu ── */}
      {mobileMenuOpen && (
        <div className="bg-[#0b1f3c] border-b border-blue-800 text-white p-4 space-y-3 md:hidden">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded hover:bg-white/10 font-medium"
          >
            <Home className="h-4 w-4 text-blue-300" />
            Home
          </Link>
          <Link
            href="/artists"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded bg-[#b45309] text-white font-semibold"
          >
            <Vote className="h-4 w-4" />
            Delegate / Voter Showcase
          </Link>
          <Link
            href="/artist/nomination"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded bg-white text-[#0f2d59] font-bold"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            Artist Registration
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded hover:bg-white/10 font-medium"
          >
            <Award className="h-4 w-4 text-amber-400" />
            Leaderboard &amp; Live Graph
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded bg-[#0f172a] text-white font-medium"
          >
            <Shield className="h-4 w-4 text-blue-400" />
            Admin Portal
          </Link>
        </div>
      )}
    </header>
  );
}
