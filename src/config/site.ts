/**
 * @file Global site configuration for the Tribal Heritage Vote platform.
 */

/** A navigation link rendered in headers, footers, or sidebars. */
export interface NavLink {
  /** Display label */
  readonly label: string;
  /** Route or external URL */
  readonly href: string;
}

/** Social media link. */
export interface SocialLink {
  /** Platform name */
  readonly platform: string;
  /** Profile / page URL */
  readonly url: string;
  /** Optional icon identifier (e.g. lucide icon name) */
  readonly icon?: string;
}

/** Top-level site configuration shape. */
export interface SiteConfig {
  /** Short site name */
  readonly name: string;
  /** Full document title */
  readonly title: string;
  /** Meta description */
  readonly description: string;
  /** Canonical site URL */
  readonly url: string;
  /** City of the organising body */
  readonly organizerCity: string;
  /** State of the organising body */
  readonly organizerState: string;
  /** IANA timezone for display dates */
  readonly timezone: string;
  /** Primary public navigation links */
  readonly navLinks: readonly NavLink[];
  /** Social media profiles */
  readonly socialLinks: readonly SocialLink[];
  /** Footer links (legal / policy pages) */
  readonly footerLinks: readonly NavLink[];
}

/**
 * Canonical site configuration used across the application.
 */
export const siteConfig: SiteConfig = {
  name: 'Tribal Heritage Vote',
  title: 'Adivasi Artists Nomination & Voting Platform',
  description:
    "Celebrating and preserving India's rich Adivasi cultural heritage through digital nomination, video showcase, and democratic voting.",
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  organizerCity: 'Rourkela',
  organizerState: 'Odisha',
  timezone: 'Asia/Kolkata',

  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Artists', href: '/artists' },
    { label: 'Categories', href: '/categories' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Results', href: '/results' },
    { label: 'Rules', href: '/rules' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],

  socialLinks: [
    // Populate with real URLs when available
    { platform: 'Facebook', url: '#', icon: 'facebook' },
    { platform: 'Instagram', url: '#', icon: 'instagram' },
    { platform: 'Twitter', url: '#', icon: 'twitter' },
    { platform: 'YouTube', url: '#', icon: 'youtube' },
  ],

  footerLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
} as const;
