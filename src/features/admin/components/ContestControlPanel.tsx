'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Square, AlertTriangle, RotateCcw, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { formatDateIST } from '@/lib/utils/formatters';

interface ContestControlPanelProps {
  contest: {
    id: string;
    title: string;
    status: string;
    voting_start_at: string;
    voting_end_at: string;
    leaderboard_visibility: string;
    results_published: boolean;
    reopening_reason?: string | null;
  };
}

export function ContestControlPanel({ contest }: ContestControlPanelProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string>(contest.status);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Reopening modal state
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenEndAt, setReopenEndAt] = useState<string>('');

  const executeTransition = async (newState: string, extraData: { reason?: string; votingEndAt?: string } = {}) => {
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/contest-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId: contest.id,
          newState,
          ...extraData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Transition failed');
      }

      setCurrentStatus(newState);
      setFeedback({ success: true, message: data.message });
      setShowReopenModal(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing state change';
      setFeedback({ success: false, message: msg });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reopenReason.trim().length < 10) {
      setFeedback({ success: false, message: 'Please provide a detailed reason (at least 10 characters).' });
      return;
    }
    if (!reopenEndAt) {
      setFeedback({ success: false, message: 'Please select a new closing date/time.' });
      return;
    }
    executeTransition('open', { reason: reopenReason, votingEndAt: new Date(reopenEndAt).toISOString() });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.success
              ? 'bg-forest-50 border border-forest-200 text-forest-800'
              : 'bg-terracotta-50 border border-terracotta-200 text-terracotta-800'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Current State Info Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-ivory-300 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-charcoal-900">{contest.title}</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Timezone: Asia/Kolkata (IST)</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-charcoal-600">Current Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentStatus === 'open'
                  ? 'bg-forest-100 text-forest-800'
                  : currentStatus === 'paused'
                  ? 'bg-amber-100 text-amber-800'
                  : currentStatus === 'closed'
                  ? 'bg-terracotta-100 text-terracotta-800'
                  : 'bg-ivory-200 text-charcoal-800'
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-charcoal-700 pt-3 border-t border-ivory-200">
          <div>
            <span className="font-semibold text-charcoal-500 block">Voting Opens:</span>
            <span>{formatDateIST(contest.voting_start_at)}</span>
          </div>
          <div>
            <span className="font-semibold text-charcoal-500 block">Voting Closes:</span>
            <span>{formatDateIST(contest.voting_end_at)}</span>
          </div>
        </div>
      </div>

      {/* Lifecycle Action Buttons */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-ivory-300 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-charcoal-900">Voting State Operations</h3>
        <p className="text-xs text-charcoal-600">
          State changes immediately take effect across the public website and voting engine.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Pause Button (if open) */}
          {currentStatus === 'open' && (
            <button
              onClick={() => executeTransition('paused')}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Emergency Pause Voting
            </button>
          )}

          {/* Resume Button (if paused) */}
          {currentStatus === 'paused' && (
            <button
              onClick={() => executeTransition('open')}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Resume Voting
            </button>
          )}

          {/* Close Button (if open or paused) */}
          {(currentStatus === 'open' || currentStatus === 'paused') && (
            <button
              onClick={() => executeTransition('closed')}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-terracotta-700 hover:bg-terracotta-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Close Voting Window
            </button>
          )}

          {/* Reopen Button (if closed) */}
          {currentStatus === 'closed' && (
            <button
              onClick={() => setShowReopenModal(true)}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reopen Voting (Audited)
            </button>
          )}

          {/* Finalize Button (if closed) */}
          {currentStatus === 'closed' && (
            <button
              onClick={() => executeTransition('finalized')}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-charcoal-900 hover:bg-black disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalize &amp; Seal Results
            </button>
          )}
        </div>
      </div>

      {/* Reopening Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 space-y-4 shadow-2xl border border-ivory-200">
            <h3 className="text-xl font-bold text-charcoal-900">Reopen Voting</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              <strong>All existing votes are preserved.</strong> Previous voters cannot vote again. A documented justification and future closing date are required.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Justification / Reason <span className="text-terracotta-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Extending deadline by 48 hours due to festival holidays in tribal regions..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-ivory-300 outline-none focus:border-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  New Voting Close Date &amp; Time <span className="text-terracotta-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={reopenEndAt}
                  onChange={(e) => setReopenEndAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-ivory-300 outline-none focus:border-forest-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-xs"
                >
                  {isUpdating ? 'Reopening...' : 'Confirm Reopening'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="py-2.5 px-4 border border-ivory-300 rounded-lg text-xs font-semibold text-charcoal-700 hover:bg-ivory-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

