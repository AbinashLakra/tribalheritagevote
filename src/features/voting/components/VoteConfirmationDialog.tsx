'use client';

import React from 'react';
import { AlertCircle, ShieldAlert, Check, X, Loader2 } from 'lucide-react';

interface VoteConfirmationDialogProps {
  isOpen: boolean;
  artistName: string;
  nominationTitle: string;
  category: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function VoteConfirmationDialog({
  isOpen,
  artistName,
  nominationTitle,
  category,
  isSubmitting,
  onConfirm,
  onCancel,
}: VoteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-ivory-200 overflow-hidden">
        {/* Warning Accent Banner */}
        <div className="h-2 bg-terracotta-500" />

        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-terracotta-100 text-terracotta-700 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-charcoal-900">
                Confirm Your Official Vote
              </h3>
              <p className="text-xs font-semibold text-terracotta-600 uppercase tracking-wider mt-0.5">
                Strict One-Vote Rule
              </p>
            </div>
          </div>

          <div className="p-4 bg-ivory-100 rounded-xl space-y-2 border border-ivory-300">
            <div className="text-xs text-charcoal-500 uppercase font-semibold">
              Selected Candidate
            </div>
            <p className="text-base font-bold text-charcoal-900">{artistName}</p>
            <p className="text-xs text-charcoal-700 font-medium">
              Performance: &ldquo;{nominationTitle}&rdquo;
            </p>
            <p className="text-xs text-forest-800 font-semibold">{category}</p>
          </div>

          <div className="p-3.5 bg-terracotta-50 rounded-xl border border-terracotta-200 flex items-start gap-2.5 text-xs text-terracotta-800 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-terracotta-600" />
            <span>
              <strong>This action is final and irreversible.</strong> Under national contest rules, each verified mobile identity may cast only <strong>one vote</strong> for the entire contest. You cannot change your vote later.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3 px-4 bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Vote...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Yes, Cast My Vote
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 border border-ivory-300 hover:bg-ivory-100 text-charcoal-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

