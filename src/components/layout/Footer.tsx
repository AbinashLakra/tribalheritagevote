import Link from "next/link";
import { TribalRibbonBorder } from "@/components/shared/TribalRibbonBorder";

export function Footer() {
  return (
    <footer className="w-full mt-auto">
      {/* ── Tribal Dancing Figures Ribbon at top of Footer ── */}
      <TribalRibbonBorder variant="light" />

      {/* ── Deep Blue Footer Content (Replacing Maroon) ── */}
      <div className="bg-[#0f2d59] text-white py-8 px-4 sm:px-6 lg:px-8 border-t border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center space-y-4 text-center">
          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-blue-200">
            <Link href="/terms" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Terms &amp; Conditions
            </Link>
            <span className="text-blue-400 opacity-60">•</span>
            <Link href="/privacy" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-blue-400 opacity-60">•</span>
            <Link href="/rules" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Voting Rules &amp; Guidelines
            </Link>
            <span className="text-blue-400 opacity-60">•</span>
            <Link href="/contact" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Contact Us
            </Link>
          </nav>

          {/* Copyright & Birsa Munda tribute text matching screenshot */}
          <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
            &copy; 2026 Tribal Heritage Organizer. All Rights Reserved. Celebrating Dharti Aaba Veer Birsa Munda&rsquo;s 151st Jayanti.
            <br />
            <span className="text-amber-400/90 font-medium">Headquartered in Rourkela, Sundargarh, Odisha, India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
