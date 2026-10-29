/**
 * @file Tailwind CSS class-name merge utility.
 * Combines {@link clsx} conditional class joining with {@link twMerge}
 * deduplication so that Tailwind utility conflicts are resolved correctly.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, resolving Tailwind CSS utility conflicts.
 *
 * @param inputs - Any number of class values accepted by `clsx`
 * @returns A single, deduplicated class-name string
 *
 * @example
 * ```ts
 * cn('px-4 py-2', 'px-6'); // 'px-6 py-2'
 * cn('text-red-500', isActive && 'text-green-500');
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
