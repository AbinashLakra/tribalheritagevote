/**
 * @file Skeleton loading placeholders for the Tribal Heritage Vote platform.
 * Provides visual feedback while content is being fetched.
 */

import { cn } from "@/lib/utils/cn";

/* ──────────────────────────────────────────────────────────────
   Shared pulse bar
   ────────────────────────────────────────────────────────────── */

/** A single animated skeleton bar. */
function SkeletonBar({
  className,
}: {
  /** Additional Tailwind classes for sizing. */
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-ivory-200", className)}
      aria-hidden="true"
    />
  );
}

/* ──────────────────────────────────────────────────────────────
   SkeletonText
   ────────────────────────────────────────────────────────────── */

/** Props for {@link SkeletonText}. */
export interface SkeletonTextProps {
  /** Number of text lines to render. @default 3 */
  lines?: number;
}

/**
 * Renders animated placeholder text lines with varying widths.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={4} />
 * ```
 */
export function SkeletonText({ lines = 3 }: SkeletonTextProps) {
  /** Varying widths to look natural. */
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4", "w-2/3"];

  return (
    <div className="space-y-2.5" role="status" aria-label="Loading text">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBar
          key={i}
          className={cn("h-4", widths[i % widths.length])}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SkeletonCard
   ────────────────────────────────────────────────────────────── */

/**
 * Skeleton placeholder shaped like an artist card.
 *
 * Mimics an image area, title bar, and two text lines.
 *
 * @example
 * ```tsx
 * <SkeletonCard />
 * ```
 */
export function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-ivory-300 bg-white"
      role="status"
      aria-label="Loading card"
    >
      {/* Image placeholder */}
      <SkeletonBar className="h-48 w-full rounded-none" />

      {/* Content area */}
      <div className="space-y-3 p-4">
        <SkeletonBar className="h-5 w-3/4" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-5/6" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SkeletonTable
   ────────────────────────────────────────────────────────────── */

/** Props for {@link SkeletonTable}. */
export interface SkeletonTableProps {
  /** Number of rows to render. @default 5 */
  rows?: number;
  /** Number of columns per row. @default 4 */
  columns?: number;
}

/**
 * Skeleton placeholder for tabular data.
 *
 * Renders a header row and body rows as animated pulse bars.
 *
 * @example
 * ```tsx
 * <SkeletonTable rows={8} columns={5} />
 * ```
 */
export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-ivory-300 bg-white"
      role="status"
      aria-label="Loading table"
    >
      {/* Header row */}
      <div className="flex gap-4 border-b border-ivory-200 bg-ivory-100/50 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <SkeletonBar key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            "flex gap-4 px-4 py-3",
            rowIdx < rows - 1 && "border-b border-ivory-200",
          )}
        >
          {Array.from({ length: columns }, (_, colIdx) => (
            <SkeletonBar key={`r${rowIdx}-c${colIdx}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
