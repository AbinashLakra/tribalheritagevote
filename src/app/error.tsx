"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service in production
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-terracotta-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-terracotta-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-charcoal-900">
            Something went wrong
          </h1>
          <p className="text-charcoal-500">
            An unexpected error occurred. Please try again or contact support if
            the issue persists.
          </p>
          {error.digest && (
            <p className="text-xs text-charcoal-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-forest-700 text-white rounded-lg hover:bg-forest-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

