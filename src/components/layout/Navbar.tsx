"use client";

/**
 * @file Responsive navigation bar for the Tribal Heritage Vote platform.
 * Includes desktop links, mobile hamburger menu, and a prominent Nominate CTA.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, TreePine } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/config/site";

/**
 * Primary site navigation bar.
 *
 * Renders a sticky, backdrop-blurred header with desktop nav links,
 * a mobile hamburger menu, and a "Nominate" call-to-action button.
 */
export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-ivory-300/60",
        "bg-ivory-50/80 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo / Brand ── */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label={siteConfig.name}
        >
          <TreePine className="h-7 w-7 text-forest-600" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight text-forest-700">
            {siteConfig.name}
          </span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {siteConfig.navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-forest-50 text-forest-700"
                    : "text-charcoal-600 hover:bg-ivory-200 hover:text-charcoal-900",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop CTA + Mobile Toggle ── */}
        <div className="flex items-center gap-3">
          {/* Nominate CTA (always visible) */}
          <Link
            href="/artist/nomination"
            className={cn(
              "hidden rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm sm:inline-flex",
              "bg-terracotta-500 transition-colors hover:bg-terracotta-600",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-500",
            )}
          >
            Nominate
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-md p-2 lg:hidden",
              "text-charcoal-600 hover:bg-ivory-200 hover:text-charcoal-900",
              "transition-colors",
            )}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Slide-Down Menu ── */}
      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden border-t border-ivory-300/60 lg:hidden",
          "transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0",
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="space-y-1 px-4 pb-4 pt-2" aria-label="Mobile">
          {siteConfig.navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                  isActive
                    ? "bg-forest-50 text-forest-700"
                    : "text-charcoal-600 hover:bg-ivory-200 hover:text-charcoal-900",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Mobile Nominate CTA */}
          <Link
            href="/artist/nomination"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "mt-2 block rounded-lg px-3 py-2.5 text-center text-base font-semibold text-white",
              "bg-terracotta-500 transition-colors hover:bg-terracotta-600",
            )}
          >
            Nominate
          </Link>
        </nav>
      </div>
    </header>
  );
}
