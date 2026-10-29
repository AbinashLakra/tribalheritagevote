/**
 * @file Site footer for the Tribal Heritage Vote platform.
 * Three-column layout with about info, quick links, and contact details.
 */

import Link from "next/link";
import { TreePine, Mail, MapPin } from "lucide-react";

import { siteConfig } from "@/config/site";

/** Quick-link subset displayed in the footer. */
const quickLinks = siteConfig.navLinks.filter((link) =>
  ["Artists", "Categories", "Leaderboard", "About", "Contact"].includes(
    link.label,
  ),
);

/**
 * Primary site footer.
 *
 * Server Component rendered at the bottom of every public page.
 * Uses the earth-inspired palette with a subtle tribal pattern background.
 */
export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="tribal-pattern-bg border-t border-charcoal-800 bg-charcoal-950 text-ivory-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Three-Column Grid ── */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1 — About */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <TreePine
                className="h-6 w-6 text-forest-400"
                aria-hidden="true"
              />
              <span className="text-lg font-bold text-ivory-100">
                {siteConfig.name}
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ivory-300">
              {siteConfig.description}
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ivory-100">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ivory-300 transition-colors hover:text-forest-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact & Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ivory-100">
              Contact &amp; Legal
            </h3>

            <address className="space-y-3 not-italic">
              <div className="flex items-start gap-2 text-sm text-ivory-300">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-400"
                  aria-hidden="true"
                />
                <span>
                  {siteConfig.organizerCity}, {siteConfig.organizerState}, India
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-ivory-300">
                <Mail
                  className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-400"
                  aria-hidden="true"
                />
                <a
                  href="mailto:contact@tribalheritagevote.org"
                  className="transition-colors hover:text-forest-400"
                >
                  contact@tribalheritagevote.org
                </a>
              </div>
            </address>

            {/* Legal Links */}
            <ul className="mt-4 flex gap-4">
              {siteConfig.footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ivory-400 transition-colors hover:text-forest-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Copyright Bar ── */}
        <div className="mt-10 border-t border-charcoal-800 pt-6 text-center text-xs text-ivory-400">
          &copy; {currentYear} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
