/**
 * @file Display-formatting utilities for numbers, dates, phone numbers, and file sizes.
 * All functions return locale-aware strings suitable for UI rendering.
 */

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Formats a number using the Indian numbering system (lakhs / crores).
 *
 * @param num - The number to format
 * @returns A locale-formatted string (e.g. `"12,34,567"`)
 *
 * @example
 * ```ts
 * formatIndianNumber(1234567); // "12,34,567"
 * ```
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

// ---------------------------------------------------------------------------
// Phone formatting
// ---------------------------------------------------------------------------

/**
 * Masks the middle digits of a phone number for privacy display.
 * Expects a 10-digit Indian mobile number, optionally prefixed with `+91` or `91`.
 *
 * @param phone - Raw phone string (e.g. `"+919876543210"` or `"9876543210"`)
 * @returns A masked display string (e.g. `"+91 98***43210"`)
 *
 * @example
 * ```ts
 * formatPhoneDisplay('+919876543210'); // "+91 98***43210"
 * formatPhoneDisplay('9876543210');    // "+91 98***43210"
 * ```
 */
export function formatPhoneDisplay(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Extract last 10 digits (the actual mobile number)
  const mobile =
    digits.length > 10 ? digits.slice(digits.length - 10) : digits;

  if (mobile.length !== 10) {
    // Return as-is when the number doesn't match expected length
    return phone;
  }

  return `+91 ${mobile.slice(0, 2)}***${mobile.slice(5)}`;
}

// ---------------------------------------------------------------------------
// Date / time formatting
// ---------------------------------------------------------------------------

/**
 * Formats a date into a human-readable IST (Asia/Kolkata) string.
 *
 * @param date - A `Date` object or ISO-8601 string
 * @returns Formatted date string in IST (e.g. `"29 Oct 2026, 10:32 PM"`)
 *
 * @example
 * ```ts
 * formatDateIST(new Date()); // "29 Oct 2026, 10:32 PM"
 * ```
 */
export function formatDateIST(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Returns a human-friendly relative time string (e.g. "2 hours ago", "in 3 days").
 *
 * @param date - A `Date` object or ISO-8601 string
 * @returns Relative time description
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 3600_000)); // "1 hour ago"
 * ```
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const suffix = (value: number, unit: string): string => {
    const plural = value === 1 ? '' : 's';
    return isFuture
      ? `in ${value} ${unit}${plural}`
      : `${value} ${unit}${plural} ago`;
  };

  if (seconds < 60) return 'just now';
  if (minutes < 60) return suffix(minutes, 'minute');
  if (hours < 24) return suffix(hours, 'hour');
  if (days < 7) return suffix(days, 'day');
  if (weeks < 5) return suffix(weeks, 'week');
  if (months < 12) return suffix(months, 'month');
  return suffix(years, 'year');
}

// ---------------------------------------------------------------------------
// File size formatting
// ---------------------------------------------------------------------------

/**
 * Converts a byte count into a human-readable file-size string.
 *
 * @param bytes - Number of bytes
 * @returns Formatted size (e.g. `"2.5 MB"`, `"150 KB"`)
 *
 * @example
 * ```ts
 * formatFileSize(2_621_440); // "2.5 MB"
 * formatFileSize(153_600);   // "150 KB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Show decimals only for values ≥ 1 KB
  const formatted =
    unitIndex === 0 ? size.toString() : size.toFixed(size < 10 ? 2 : 1);

  // Strip trailing zeros after decimal
  const cleaned = formatted.includes('.')
    ? formatted.replace(/\.?0+$/, '')
    : formatted;

  return `${cleaned} ${units[unitIndex]}`;
}
