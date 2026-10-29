/**
 * @file Reusable statistic card for the Tribal Heritage Vote platform.
 * Displays a metric with an icon, label, value, and optional description.
 */

import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Props for the {@link StatCard} component. */
export interface StatCardProps {
  /** Lucide icon component to display alongside the stat. */
  icon: LucideIcon;
  /** Short label for the statistic (e.g. "Total Artists"). */
  label: string;
  /** The primary value to display (e.g. "1,234" or 42). */
  value: string | number;
  /** Optional supplementary text below the value. */
  description?: string;
}

/**
 * A compact card displaying a single statistic.
 *
 * Renders as a Server Component with an icon, label, value, and
 * optional description. Styled with a subtle border and hover shadow.
 *
 * @example
 * ```tsx
 * import { Users } from "lucide-react";
 * <StatCard icon={Users} label="Total Artists" value={1234} description="Registered this season" />
 * ```
 */
export function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ivory-300 bg-white p-5",
        "shadow-sm transition-shadow duration-200 hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50">
          <Icon className="h-5 w-5 text-forest-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-charcoal-500">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-charcoal-900">
            {value}
          </p>
        </div>
      </div>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-charcoal-400">
          {description}
        </p>
      )}
    </div>
  );
}
