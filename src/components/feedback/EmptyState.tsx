/**
 * @file Reusable empty-state component for the Tribal Heritage Vote platform.
 * Displayed when a list or section has no data to show.
 */

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Props for the {@link EmptyState} component. */
export interface EmptyStateProps {
  /** Lucide icon displayed above the title. */
  icon: LucideIcon;
  /** Primary headline (e.g. "No Artists Found"). */
  title: string;
  /** Supporting description explaining the empty state. */
  description: string;
  /** Optional action button rendered below the description. */
  action?: {
    /** Button label text. */
    label: string;
    /** Navigation destination. */
    href: string;
  };
}

/**
 * Displays a friendly empty-state placeholder.
 *
 * Use this wherever content may be absent — empty search results,
 * no nominations, etc. An optional action button directs the user
 * towards a constructive next step.
 *
 * @example
 * ```tsx
 * import { Search } from "lucide-react";
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try adjusting your search or filter criteria."
 *   action={{ label: "Browse All Artists", href: "/artists" }}
 * />
 * ```
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ivory-200">
        <Icon className="h-8 w-8 text-charcoal-400" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold text-charcoal-800">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal-500">
        {description}
      </p>

      {action && (
        <Link
          href={action.href}
          className={cn(
            "mt-6 inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white",
            "bg-forest-700 transition-colors hover:bg-forest-800",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500",
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
