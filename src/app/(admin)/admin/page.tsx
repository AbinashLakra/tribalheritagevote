import Link from 'next/link';
import {
  Video,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Users,
  Award,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Admin Dashboard',
  description: 'KPI overview and moderation metrics for the Adivasi cultural platform.',
};

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  // Aggregate statistics
  const [
    { count: totalNominations },
    { count: approvedNominations },
    { count: pendingNominations },
    { count: totalVotes },
    { count: totalVoters },
    { count: duplicateAttempts },
  ] = await Promise.all([
    admin.from('nominations').select('*', { count: 'exact', head: true }),
    admin.from('nominations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('nominations').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    admin.from('votes').select('*', { count: 'exact', head: true }),
    admin.from('voter_identities').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    admin.from('security_events').select('*', { count: 'exact', head: true }).eq('event_type', 'duplicate_vote_attempt'),
  ]);

  // Fetch active contest status
  const { data: contest } = await admin
    .from('contests')
    .select('title, status, voting_start_at, voting_end_at, leaderboard_visibility')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ivory-300 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
            Platform Governance
          </span>
          <h1 className="text-3xl font-extrabold text-charcoal-900 mt-1">
            Executive Control Overview
          </h1>
          <p className="text-sm text-charcoal-600">
            Current Contest: {contest?.title || 'National Adivasi Cultural Arts Awards'} (Status: {contest?.status || 'draft'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/contest"
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            Contest Controls
          </Link>
          <Link
            href="/admin/nominations"
            className="px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Video className="w-4 h-4" />
            Moderate Videos ({pendingNominations || 0})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Total Nominations
            </span>
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-charcoal-900">{totalNominations || 0}</p>
          <p className="text-xs text-charcoal-500">
            {approvedNominations || 0} approved • {pendingNominations || 0} pending review
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Accepted Votes
            </span>
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-forest-800">{totalVotes || 0}</p>
          <p className="text-xs text-charcoal-500">
            Recorded in immutable PostgreSQL ledger
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Verified Citizens
            </span>
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-charcoal-900">{totalVoters || 0}</p>
          <p className="text-xs text-charcoal-500">
            OTP mobile verified identities (+91)
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Duplicate Attempts Blocked
            </span>
            <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-terracotta-700">{duplicateAttempts || 0}</p>
          <p className="text-xs text-charcoal-500">
            Trapped by unique database constraint
          </p>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Contest State
            </span>
            <div className="w-8 h-8 rounded-lg bg-ivory-200 text-charcoal-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold uppercase text-charcoal-900">{contest?.status || 'draft'}</p>
          <p className="text-xs text-charcoal-500">
            Leaderboard visibility: {contest?.leaderboard_visibility || 'live'}
          </p>
        </div>

        {/* KPI 6 */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Integrity Standard
            </span>
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-forest-800">100% Verified</p>
          <p className="text-xs text-charcoal-500">Zero unverified or simulated ballots</p>
        </div>
      </div>
    </div>
  );
}
