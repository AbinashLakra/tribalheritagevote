'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Award,
  Users,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CONTEST_OFFICIAL_TIMELINE } from '@/lib/voting/vote-display-calculator';

export interface NominationData {
  id: string;
  title: string;
  category_id: string;
  sub_category?: string;
  category_name?: string;
  real_votes: number;
  synthetic_boost: number;
  displayed_votes: number;
  artist: {
    id: string;
    stage_name: string;
    full_name: string;
    state: string;
    district: string;
    avatar_url?: string | null;
  };
}

interface VoteLeadingDashboardProps {
  contestId: string;
  contestTitle: string;
  contestStatus: string;
  votingStartAt: string;
  votingEndAt: string;
  initialShowPublicVotes: boolean;
  initialBoostEnabled: boolean;
  initialBoostVelocityPerDay: number;
  nominations: NominationData[];
}

const COLORS = [
  '#0f2d59', '#d97706', '#059669', '#dc2626',
  '#7c3aed', '#0284c7', '#db2777', '#4b5563',
  '#b45309', '#047857', '#4338ca', '#be123c',
];

export function VoteLeadingDashboard({
  contestId,
  contestTitle,
  contestStatus,
  votingStartAt,
  votingEndAt,
  initialShowPublicVotes,
  initialBoostEnabled,
  initialBoostVelocityPerDay,
  nominations: initialNominations,
}: VoteLeadingDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showPublicVotes, setShowPublicVotes] = useState(initialShowPublicVotes);
  const [boostEnabled, setBoostEnabled] = useState(initialBoostEnabled);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter state
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<'all' | 'male' | 'female' | 'other'>('all');
  const [chartMetric, setChartMetric] = useState<'both' | 'real' | 'displayed'>('both');

  // Live countdown state
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate timing countdown to 15 Nov 12:00 PM IST
  const timing = useMemo(() => {
    const start = new Date(votingStartAt || CONTEST_OFFICIAL_TIMELINE.startAt).getTime();
    const end = new Date(votingEndAt || CONTEST_OFFICIAL_TIMELINE.endAt).getTime();
    const current = now.getTime();

    const totalDurationMs = Math.max(1, end - start);
    const elapsedMs = Math.max(0, current - start);
    const remainingMs = Math.max(0, end - current);

    const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

    const totalElapsedHours = Math.floor(elapsedMs / (3600 * 1000));
    const totalElapsedMins = Math.floor((elapsedMs % (3600 * 1000)) / (60 * 1000));

    const remDays = Math.floor(remainingMs / (86400 * 1000));
    const remHours = Math.floor((remainingMs % (86400 * 1000)) / (3600 * 1000));
    const remMinutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    const remSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

    const isClosed = current >= end;

    return {
      progressPct: Number(progressPct.toFixed(1)),
      totalElapsedHours,
      totalElapsedMins,
      remDays,
      remHours,
      remMinutes,
      remSeconds,
      isClosed,
      formattedStart: new Date(start).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }),
      formattedEnd: new Date(end).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }),
    };
  }, [now, votingStartAt, votingEndAt]);

  // Handle Public Vote Visibility Toggle
  const handleToggleVisibility = async (newVal: boolean) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/contest-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId,
          showPublicVotes: newVal,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update visibility');
      }
      setShowPublicVotes(newVal);
      setFeedback({
        type: 'success',
        message: newVal
          ? '🟢 Public Vote Visibility: LIVE. Voters & audience can now see vote counts on the leaderboard and ballot.'
          : '🔒 Public Vote Visibility: HIDDEN. Public leaderboard and ballot vote counts are now sealed from public view.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error updating visibility',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Organic Boost Toggle
  const handleToggleBoost = async (newVal: boolean) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/contest-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId,
          boostEnabled: newVal,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update boost mode');
      }
      setBoostEnabled(newVal);
      setFeedback({
        type: 'success',
        message: newVal
          ? '⚡ Organic Boost Algorithm: ACTIVE (~1,000 baseline votes per 24h scaling organically with real vote momentum).'
          : '⚙️ Raw Real Votes Only: Organic boost deactivated. Displayed counts now reflect pure database votes.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error updating boost mode',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter nominations based on gender track tab
  const filteredNominations = useMemo(() => {
    return initialNominations.filter((n) => {
      if (selectedTrackFilter === 'all') return true;
      const sub = (n.sub_category || '').toLowerCase();
      if (selectedTrackFilter === 'male') return sub.includes('male') && !sub.includes('female');
      if (selectedTrackFilter === 'female') return sub.includes('female');
      if (selectedTrackFilter === 'other') return !sub.includes('male') && !sub.includes('female');
      return true;
    });
  }, [initialNominations, selectedTrackFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalRealVotes = initialNominations.reduce((sum, n) => sum + (n.real_votes || 0), 0);
    const totalDisplayedVotes = initialNominations.reduce((sum, n) => sum + (n.displayed_votes || 0), 0);
    const totalSyntheticBoost = initialNominations.reduce((sum, n) => sum + (n.synthetic_boost || 0), 0);

    const sortedByReal = [...initialNominations].sort((a, b) => b.real_votes - a.real_votes);
    const leaderReal = sortedByReal[0];

    const sortedByDisplay = [...initialNominations].sort((a, b) => b.displayed_votes - a.displayed_votes);
    const leaderDisplay = sortedByDisplay[0];

    return {
      totalRealVotes,
      totalDisplayedVotes,
      totalSyntheticBoost,
      leaderReal,
      leaderDisplay,
      totalCandidates: initialNominations.length,
    };
  }, [initialNominations]);

  // Chart data formatted for horizontal bar chart
  const barChartData = useMemo(() => {
    return [...filteredNominations]
      .sort((a, b) => b.real_votes - a.real_votes)
      .map((nom) => ({
        name: nom.artist?.stage_name || nom.title,
        realVotes: nom.real_votes,
        displayedVotes: boostEnabled ? nom.displayed_votes : nom.real_votes,
        syntheticBoost: boostEnabled ? nom.synthetic_boost : 0,
        category: nom.category_name || 'Art Category',
        state: nom.artist?.state || 'India',
      }));
  }, [filteredNominations, boostEnabled]);

  // Category distribution for pie chart
  const categoryChartData = useMemo(() => {
    const catMap: Record<string, { name: string; real: number; display: number }> = {};
    initialNominations.forEach((n) => {
      const cat = n.category_name || 'General';
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, real: 0, display: 0 };
      }
      catMap[cat].real += n.real_votes || 0;
      catMap[cat].display += n.displayed_votes || 0;
    });
    return Object.values(catMap).sort((a, b) => b.real - a.real);
  }, [initialNominations]);

  return (
    <div className="space-y-6">
      {/* ──────────────── 1. CONTROL HEADER & PUBLIC VISIBILITY TOGGLE ──────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Main Admin Control Section • Confidential</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f2d59]">
              Vote Leading Graph &amp; Real-Time Analytics Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Contest: <strong>{contestTitle}</strong> • Live monitoring of Citizen Real Votes vs Audience Displayed Counts.
            </p>
          </div>

          {/* Quick Action Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* PUBLIC VISIBILITY TOGGLE */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 px-2 uppercase tracking-wider">
                Public Votes:
              </span>
              <button
                type="button"
                onClick={() => handleToggleVisibility(true)}
                disabled={isUpdating || showPublicVotes}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showPublicVotes
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleVisibility(false)}
                disabled={isUpdating || !showPublicVotes}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !showPublicVotes
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide / Seal</span>
              </button>
            </div>

            {/* ORGANIC BOOST ALGORITHM TOGGLE */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 px-2 uppercase tracking-wider">
                Display Boost:
              </span>
              <button
                type="button"
                onClick={() => handleToggleBoost(!boostEnabled)}
                disabled={isUpdating}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  boostEnabled
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{boostEnabled ? 'Active (~1k/24h)' : 'Off (Pure Real)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Status Callout Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Public Audience View:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase ${
                showPublicVotes ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {showPublicVotes ? '🟢 Counts Visible' : '🔒 Counts Hidden'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Display Layer Boost:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase ${
                boostEnabled ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {boostEnabled ? '⚡ Organic ~1000/24h' : '⚙️ Pure Real'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Database Integrity:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase bg-blue-100 text-blue-900">
              🛡️ 100% Cryptographic Real
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────── 2. LIVE TIMING COUNTDOWN TO 15 NOV 12:00 PM IST ──────────────── */}
      <div className="bg-gradient-to-br from-[#0a1e3b] via-[#0f2d59] to-[#153e77] text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Contest Voting Window Countdown</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              12 Nov 2026, 1:00 PM IST → 15 Nov 2026, 12:00 PM IST
            </h3>
            <p className="text-xs text-blue-200">
              Elapsed: {timing.totalElapsedHours}h {timing.totalElapsedMins}m • Total Window: 71 Hours
            </p>
          </div>

          {/* Live Digits Countdown */}
          <div className="grid grid-cols-4 gap-2 text-center shrink-0">
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[54px] sm:min-w-[64px]">
              <span className="text-xl sm:text-2xl font-black block text-amber-300">
                {String(timing.remDays).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Days</span>
            </div>
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[54px] sm:min-w-[64px]">
              <span className="text-xl sm:text-2xl font-black block text-white">
                {String(timing.remHours).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Hours</span>
            </div>
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[54px] sm:min-w-[64px]">
              <span className="text-xl sm:text-2xl font-black block text-white">
                {String(timing.remMinutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Mins</span>
            </div>
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[54px] sm:min-w-[64px]">
              <span className="text-xl sm:text-2xl font-black block text-amber-400">
                {String(timing.remSeconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Secs</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-blue-200 font-bold">
            <span>Voting Started: 12 Nov 1:00 PM</span>
            <span>Contest Timeline Completion: {timing.progressPct}%</span>
            <span>Closes: 15 Nov 12:00 PM</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${timing.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ──────────────── 3. SUMMARY KPI TILES (DUAL METRICS) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Votes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Real Citizen Votes (Actual DB)
          </span>
          <p className="text-3xl font-black text-emerald-700">{stats.totalRealVotes}</p>
          <p className="text-xs text-slate-500">OTP verified mobile identities</p>
        </div>

        {/* Synthetic Boost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Organic Boost Added
          </span>
          <p className="text-3xl font-black text-amber-600">
            {boostEnabled ? `+${stats.totalSyntheticBoost}` : '0 (Off)'}
          </p>
          <p className="text-xs text-slate-500">~1,000/24h non-round display buffer</p>
        </div>

        {/* Public Display Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Audience Display Count
          </span>
          <p className="text-3xl font-black text-[#0f2d59]">
            {boostEnabled ? stats.totalDisplayedVotes : stats.totalRealVotes}
          </p>
          <p className="text-xs text-slate-500">
            {showPublicVotes ? 'Currently visible to public' : 'Currently hidden from public'}
          </p>
        </div>

        {/* Current Overall Leader */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            #1 Overall Leader (Real Votes)
          </span>
          <p className="text-lg font-black text-[#0f2d59] truncate">
            {stats.leaderReal?.artist?.stage_name || 'No votes yet'}
          </p>
          <p className="text-xs text-emerald-700 font-bold">
            {stats.leaderReal?.real_votes || 0} real votes (Display: {stats.leaderReal?.displayed_votes || 0})
          </p>
        </div>
      </div>

      {/* ──────────────── 4. VOTE LEADING FLOW CHART & COMPARISON GRAPH ──────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-700" />
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0f2d59]">
                Contestant Flow Chart &amp; Race Graph
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare actual citizen votes against audience displayed numbers. Sorted in descending order.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTrackFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTrackFilter === 'all'
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tracks ({initialNominations.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrackFilter('male')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTrackFilter === 'male'
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Male Track
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrackFilter('female')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTrackFilter === 'female'
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Female Track
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        {isMounted && barChartData.length > 0 ? (
          <div className="w-full h-[400px] sm:h-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#1e293b"
                  fontSize={12}
                  fontWeight={700}
                  width={110}
                  tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 14)}…` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[180px]">
                          <p className="font-extrabold text-amber-300 text-sm">{data.name}</p>
                          <p className="text-[11px] text-slate-300">{data.category} • {data.state}</p>
                          <div className="pt-1.5 border-t border-slate-700 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-emerald-400 font-bold">Real Verified Votes:</span>
                              <span className="font-extrabold">{data.realVotes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-400 font-bold">Organic Boost:</span>
                              <span className="font-extrabold">+{data.syntheticBoost}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-800 pt-1 text-white">
                              <span className="font-black">Audience Display:</span>
                              <span className="font-black">{data.displayedVotes}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar
                  dataKey="displayedVotes"
                  name="Audience Displayed Votes"
                  fill="#d97706"
                  radius={[0, 8, 8, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="realVotes"
                  name="Real Citizen Votes (DB Ledger)"
                  fill="#059669"
                  radius={[0, 8, 8, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
            Loading interactive charts...
          </div>
        )}
      </div>

      {/* ──────────────── 5. CATEGORY DISTRIBUTION & VELOCITY METRICS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700" />
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f2d59]">
              Vote Share Across Art Categories
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Real citizen voting activity breakdown by official cultural categories.
          </p>

          {isMounted && categoryChartData.length > 0 ? (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="real"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-bold text-amber-300">{d.name}</p>
                            <p className="text-emerald-400">Real Votes: {d.real}</p>
                            <p className="text-amber-400">Display Total: {d.display}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-xs">
              Loading distribution chart...
            </div>
          )}
        </div>

        {/* Contest Insights Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f2d59]">
              Live Governance &amp; Velocity Audit
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Automated intelligence report on current participation cadence.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block text-xs">
                Hourly Organic Velocity Target:
              </span>
              <p className="text-slate-600">
                1,000 / 24 ≈ <strong>41.67 votes/hour baseline</strong>, dynamically modulated by candidate real vote momentum.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block text-xs">
                Contest Integrity Guarantee:
              </span>
              <p className="text-slate-600">
                Participents jitenge apne <strong>REAL citizen votes</strong> se. The synthetic boost is purely a presentation layer to drive organic audience engagement and does not alter the database audit logs.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block text-xs">
                Audience Discovery Secrecy:
              </span>
              <p className="text-slate-600">
                Zero leakages. All numbers end in natural non-round digits (no round 100, 500, or 1000). The audience only sees legitimate-looking vote tallies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── 6. COMPREHENSIVE DUAL-LEDGER TABLE ──────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f2d59]">
              Dual Ledger: Real Citizen Votes vs Audience Displayed Counts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete candidate-by-candidate breakdown for Main Admin oversight.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-600">
            Total Candidates: {filteredNominations.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate / Artist</th>
                <th className="py-3 px-4">Category &amp; Track</th>
                <th className="py-3 px-4 text-right text-emerald-800">Real Votes (DB)</th>
                <th className="py-3 px-4 text-right text-amber-700">Organic Boost</th>
                <th className="py-3 px-4 text-right text-[#0f2d59]">Displayed Votes</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNominations
                .sort((a, b) => b.real_votes - a.real_votes)
                .map((nom, idx) => {
                  const sharePct =
                    stats.totalRealVotes > 0
                      ? ((nom.real_votes / stats.totalRealVotes) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={nom.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-800">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {nom.artist?.avatar_url ? (
                              <img
                                src={nom.artist.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              nom.artist?.stage_name?.charAt(0) || 'A'
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {nom.artist?.stage_name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                              {nom.title} • {nom.artist?.district}, {nom.artist?.state}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {nom.category_name}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          Track: {nom.sub_category || 'general'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                        {nom.real_votes}
                        <span className="block text-[10px] text-slate-400 font-medium">
                          {sharePct}% share
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                        +{nom.synthetic_boost}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#0f2d59] text-sm">
                        {nom.displayed_votes}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
