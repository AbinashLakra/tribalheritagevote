'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  Save,
  Radio,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
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
    settings?: {
      show_public_votes?: boolean;
      boost_enabled?: boolean;
      boost_velocity_per_day?: number;
    } | null;
  };
}

function toDatetimeLocal(isoStr?: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ContestControlPanel({ contest }: ContestControlPanelProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string>(contest.status);
  const [votingStart, setVotingStart] = useState<string>(toDatetimeLocal(contest.voting_start_at));
  const [votingEnd, setVotingEnd] = useState<string>(toDatetimeLocal(contest.voting_end_at));

  const [showPublicVotes, setShowPublicVotes] = useState<boolean>(
    contest.settings?.show_public_votes ?? (contest.leaderboard_visibility !== 'hidden')
  );
  const [boostEnabled, setBoostEnabled] = useState<boolean>(
    contest.settings?.boost_enabled ?? true
  );

  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Reopening modal state
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenEndAt, setReopenEndAt] = useState<string>('');

  const handleToggleVisibility = async (newVal: boolean) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/contest-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestId: contest.id, showPublicVotes: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update visibility');
      setShowPublicVotes(newVal);
      setFeedback({ success: true, message: data.message });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ success: false, message: err instanceof Error ? err.message : 'Error updating visibility' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBoost = async (newVal: boolean) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/contest-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestId: contest.id, boostEnabled: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update boost mode');
      setBoostEnabled(newVal);
      setFeedback({ success: true, message: data.message });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ success: false, message: err instanceof Error ? err.message : 'Error updating boost mode' });
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setFeedback(null);

    try {
      if (!votingEnd) {
        throw new Error('Please select a valid voting end date and time.');
      }

      const res = await fetch('/api/admin/contest-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId: contest.id,
          votingStartAt: votingStart ? new Date(votingStart).toISOString() : undefined,
          votingEndAt: new Date(votingEnd).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update schedule');
      }

      setFeedback({
        success: true,
        message: 'Voting schedule updated! Homepage live countdown is now synced in real-time.',
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating schedule';
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
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-xs ${
            feedback.success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Current State Info Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0f2d59] text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Live Contest Governance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{contest.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Timezone: Asia/Kolkata (IST)</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Voting Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                currentStatus === 'open'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : currentStatus === 'paused'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : currentStatus === 'closed'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {currentStatus === 'open' ? '🟢 Live / Open' : currentStatus === 'paused' ? '⏸️ Paused' : currentStatus === 'closed' ? '⏹️ Closed' : currentStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 pt-4 border-t border-slate-200">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">Current Voting Open Time:</span>
            <span className="font-semibold text-slate-900">{formatDateIST(contest.voting_start_at)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">Current Voting Close / Countdown Target:</span>
            <span className="font-semibold text-slate-900">{formatDateIST(contest.voting_end_at)}</span>
          </div>
        </div>
      </div>

      {/* ──────────────── SCHEDULE CONFIGURATION & LIVE COUNTDOWN SYNC ──────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-[#0f2d59] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f2d59]">
              Voting Schedule &amp; Homepage Countdown Sync
            </h3>
            <p className="text-xs text-slate-600">
              Update the voting start and end times below. When saved, the public homepage countdown updates instantly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Voting Start Date &amp; Time (IST)
              </label>
              <input
                type="datetime-local"
                value={votingStart}
                onChange={(e) => setVotingStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Voting End Date &amp; Time (Live Countdown Target)
              </label>
              <input
                type="datetime-local"
                value={votingEnd}
                onChange={(e) => setVotingEnd(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500 italic">
              * Changing the end date directly changes the live countdown displayed on the main landing page.
            </p>

            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-xl bg-[#0f2d59] hover:bg-blue-900 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Dates &amp; Sync Live Countdown</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ──────────────── STATE TOGGLE OPERATIONS ──────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f2d59]">
            Voting State Operations &amp; Quick Controls
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Start, stop, or pause public voting. State changes immediately take effect across the voting engine and homepage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Start / Open Button (if not open) */}
          {currentStatus !== 'open' && (
            <button
              onClick={() => executeTransition('open')}
              disabled={isUpdating}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Start / Open Voting Now</span>
            </button>
          )}

          {/* Pause Button (if open) */}
          {currentStatus === 'open' && (
            <button
              onClick={() => executeTransition('paused')}
              disabled={isUpdating}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Emergency Pause Voting</span>
            </button>
          )}

          {/* Resume Button (if paused) */}
          {currentStatus === 'paused' && (
            <button
              onClick={() => executeTransition('open')}
              disabled={isUpdating}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Resume Voting</span>
            </button>
          )}

          {/* Close Button (if open or paused) */}
          {(currentStatus === 'open' || currentStatus === 'paused') && (
            <button
              onClick={() => executeTransition('closed')}
              disabled={isUpdating}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Stop / Close Voting Window</span>
            </button>
          )}

          {/* Reopen Button (if closed) */}
          {currentStatus === 'closed' && (
            <button
              onClick={() => setShowReopenModal(true)}
              disabled={isUpdating}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reopen Voting (Audited)</span>
            </button>
          )}

          {/* Finalize Button (if closed) */}
          {currentStatus === 'closed' && (
            <button
              onClick={() => executeTransition('finalized')}
              disabled={isUpdating}
              className="px-5 py-3 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Finalize &amp; Seal Results</span>
            </button>
          )}
        </div>
      </div>

      {/* ──────────────── PUBLIC VOTE VISIBILITY & AUDIENCE DISPLAY CONTROLS ──────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f2d59]">
            Public Vote Visibility &amp; Audience Display Controls
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Instantly show or hide vote counts on the public website and toggle the organic presentation layer boost.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Public Visibility Toggle Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Public Leaderboard &amp; Votes
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  showPublicVotes ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {showPublicVotes ? '🟢 Visible to Public' : '🔒 Sealed / Hidden'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              When hidden, voters and artists see &ldquo;Votes Sealed&rdquo; without revealing vote tallies during voting.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleVisibility(true)}
                disabled={isUpdating || showPublicVotes}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  showPublicVotes
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show to Public</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleVisibility(false)}
                disabled={isUpdating || !showPublicVotes}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !showPublicVotes
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide / Seal</span>
              </button>
            </div>
          </div>

          {/* Organic Boost Toggle Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Organic Display Boost
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  boostEnabled ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {boostEnabled ? '⚡ Active (~1000/24h)' : '⚙️ Pure Real Only'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Generates a 100% natural, non-round presentation curve scaling with real votes. Database votes remain strictly untouched.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleBoost(true)}
                disabled={isUpdating || boostEnabled}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  boostEnabled
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Activate Boost</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleBoost(false)}
                disabled={isUpdating || !boostEnabled}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !boostEnabled
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Raw Votes Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reopening Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900">Reopen Voting Window</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>All existing votes are preserved.</strong> Previous voters cannot vote again for the same artist. A documented justification and future closing date are required.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justification / Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Extending deadline by 48 hours due to festival holidays in tribal regions..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Voting Close Date &amp; Time <span className="text-rose-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={reopenEndAt}
                  onChange={(e) => setReopenEndAt(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  {isUpdating ? 'Reopening...' : 'Confirm Reopening'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
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
