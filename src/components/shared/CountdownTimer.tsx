"use client";

/**
 * @file Countdown timer component for the Tribal Heritage Vote platform.
 * Displays a live countdown to a target date, updating every second.
 */

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

/** Props for the {@link CountdownTimer} component. */
export interface CountdownTimerProps {
  /** ISO 8601 date string for the target date. */
  targetDate: string;
  /** Label displayed above the timer (e.g. "Voting Ends In"). */
  label: string;
}

/** Represents the remaining time broken into units. */
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Calculates the remaining time from now until `target`. */
function calculateTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Labels for each time unit. */
const UNIT_LABELS: readonly (keyof TimeLeft)[] = [
  "days",
  "hours",
  "minutes",
  "seconds",
] as const;

/**
 * Live countdown timer that ticks every second.
 *
 * Displays days, hours, minutes, and seconds in individual styled cards.
 * Shows a completion message when the countdown reaches zero.
 * Handles invalid dates gracefully with an error message.
 *
 * @example
 * ```tsx
 * <CountdownTimer targetDate="2026-12-31T23:59:59Z" label="Voting Ends In" />
 * ```
 */
export function CountdownTimer({ targetDate, label }: CountdownTimerProps) {
  const parsedDate = new Date(targetDate);
  const isValidDate = !isNaN(parsedDate.getTime());

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    isValidDate ? calculateTimeLeft(parsedDate) : null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!isValidDate) return;

    // Compute immediately on mount
    setTimeLeft(calculateTimeLeft(parsedDate));

    const intervalId = setInterval(() => {
      const remaining = calculateTimeLeft(parsedDate);
      setTimeLeft(remaining);
      if (!remaining) clearInterval(intervalId);
    }, 1_000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  // Avoid hydration mismatch by rendering a placeholder until mounted
  if (!mounted) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-charcoal-500">
          {label}
        </p>
        <div className="flex items-center justify-center gap-3">
          {UNIT_LABELS.map((unit) => (
            <div
              key={unit}
              className="flex flex-col items-center rounded-lg border border-ivory-300 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-2xl font-bold tabular-nums text-forest-700 sm:text-3xl">
                --
              </span>
              <span className="mt-1 text-xs uppercase text-charcoal-400">
                {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Invalid date
  if (!isValidDate) {
    return (
      <div className="text-center">
        <p className="text-sm text-terracotta-600">
          Invalid target date provided.
        </p>
      </div>
    );
  }

  // Countdown complete
  if (!timeLeft) {
    return (
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-charcoal-500">
          {label}
        </p>
        <p className="text-lg font-bold text-forest-700">
          🎉 The event has started!
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-charcoal-500">
        {label}
      </p>

      <div className="flex items-center justify-center gap-3">
        {UNIT_LABELS.map((unit) => (
          <div
            key={unit}
            className={cn(
              "flex flex-col items-center rounded-lg border border-ivory-300 bg-white px-4 py-3 shadow-sm",
              "transition-shadow hover:shadow-md",
            )}
          >
            <span className="text-2xl font-bold tabular-nums text-forest-700 sm:text-3xl">
              {String(timeLeft[unit]).padStart(2, "0")}
            </span>
            <span className="mt-1 text-xs uppercase text-charcoal-400">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
