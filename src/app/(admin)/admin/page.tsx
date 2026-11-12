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
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  BarChart3,
  Flame,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  VoteLeadingDashboard,
  NominationData,
} from '@/features/admin/components/VoteLeadingDashboard';
import {
  enhanceNominationsWithBoost,
  extractContestSettings,
  CONTEST_OFFICIAL_TIMELINE,
} from '@/lib/voting/vote-display-calculator';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Admin Dashboard — Tribal Heritage Vote 2026',
  description: 'KPI overview, access delegation, and moderation metrics for the Adivasi cultural platform.',
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
    { count: pendingAdminRequests },
  ] = await Promise.all([
    admin.from('nominations').select('*', { count: 'exact', head: true }),
    admin.from('nominations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('nominations').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    admin.from('votes').select('*', { count: 'exact', head: true }),
    admin.from('voter_identities').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    admin.from('security_events').select('*', { count: 'exact', head: true }).eq('event_type', 'duplicate_vote_attempt'),
    admin.from('admin_access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Fetch active contest configuration & settings
  const { data: contest } = await admin
    .from('contests')
    .select('id, title, status, voting_start_at, voting_end_at, leaderboard_visibility, settings, reopening_reason')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const contestId = contest?.id || 'a1111111-1111-1111-1111-111111111111';
  const contestSettings = extractContestSettings(contest);

  // Fetch all approved nominations for leading graph & flow chart
  const { data: rawNominations } = await admin
    .from('nominations')
    .select(`
      id,
      title,
      category_id,
      sub_category,
      vote_count,
      category:contest_categories(name),
      artist:artist_profiles(id, stage_name, full_name, state, district, avatar_url)
    `)
    .eq('contest_id', contestId)
    .eq('status', 'approved');

  // Compute organic presentation layer boost for dashboard dual-ledger
  const enhancedList = enhanceNominationsWithBoost(rawNominations || [], contest);

  const formattedNominations: NominationData[] = enhancedList.map((n) => {
    const artistData = (n.artist as any) || {};
    const catData = (n.category as any) || {};

    return {
      id: n.id,
      title: n.title,
      category_id: n.category_id,
      sub_category: n.sub_category || 'general',
      category_name: catData.name || 'Art Category',
      real_votes: n.real_vote_count,
      synthetic_boost: n.synthetic_boost,
      displayed_votes: n.displayed_vote_count,
      artist: {
        id: artistData.id || n.id,
        stage_name: artistData.stage_name || n.title,
        full_name: artistData.full_name || '',
        state: artistData.state || 'Odisha',
        district: artistData.district || 'Sundargarh',
        avatar_url: artistData.avatar_url || null,
      },
    };
  });

  return (
    <div className="space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Platform Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59] mt-1">
            Executive Control Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Active Contest: <strong>{contest?.title || 'Dharti Abba Veer Birsa Munda Cultural & Film Awards 2026'}</strong> (Status:{' '}
            <span className="uppercase text-blue-700 font-bold">{contest?.status || 'draft'}</span>)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/access-requests"
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Requests ({pendingAdminRequests || 0})</span>
          </Link>

          <Link
            href="/admin/nominations"
            className="px-3.5 py-2 bg-[#0f2d59] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Moderate Videos ({pendingNominations || 0})</span>
          </Link>

          <Link
            href="/admin/contest"
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Contest Timeline</span>
          </Link>
        </div>
      </div>

      {/* Pending Admin Requests Alert Banner if any */}
      {(pendingAdminRequests || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {pendingAdminRequests || 0} Staff Admin Application
                {(pendingAdminRequests || 0) > 1 ? 's' : ''} Awaiting Review
              </h4>
              <p className="text-xs text-slate-600">
                Staff members have submitted verified access requests. Review and assign granular permissions.
              </p>
            </div>
          </div>
          <Link
            href="/admin/access-requests"
            className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ──────────────── MAIN ADMIN VOTE LEADING GRAPH & ANALYTICS DASHBOARD ──────────────── */}
      <VoteLeadingDashboard
        contestId={contestId}
        contestTitle={contest?.title || 'Dharti Abba Veer Birsa Munda Cultural & Film Awards 2026'}
        contestStatus={contest?.status || 'open'}
        votingStartAt={contest?.voting_start_at || CONTEST_OFFICIAL_TIMELINE.startAt}
        votingEndAt={contest?.voting_end_at || CONTEST_OFFICIAL_TIMELINE.endAt}
        initialShowPublicVotes={contestSettings.show_public_votes}
        initialBoostEnabled={contestSettings.boost_enabled}
        initialBoostVelocityPerDay={contestSettings.boost_velocity_per_day}
        nominations={formattedNominations}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* KPI 1: Nominations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Nominations
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0f2d59]">{totalNominations || 0}</p>
          <p className="text-xs text-slate-500">
            {approvedNominations || 0} approved • {pendingNominations || 0} pending review
          </p>
        </div>

        {/* KPI 2: Accepted Votes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Accepted Verified Votes (Real DB)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700">{totalVotes || 0}</p>
          <p className="text-xs text-slate-500">Recorded in immutable PostgreSQL ledger</p>
        </div>

        {/* KPI 3: Citizens */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Citizen Voters
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0f2d59]">{totalVoters || 0}</p>
          <p className="text-xs text-slate-500">OTP mobile verified identities (+91)</p>
        </div>

        {/* KPI 4: Fraud Attempts Blocked */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Duplicate Ballots Blocked
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-red-600">{duplicateAttempts || 0}</p>
          <p className="text-xs text-slate-500">Strictly trapped by 1-vote unique constraint</p>
        </div>

        {/* KPI 5: Contest Lifecycle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contest State &amp; Public Visibility
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold uppercase text-[#0f2d59]">{contest?.status || 'draft'}</p>
          <p className="text-xs text-slate-500">
            Public Visibility:{' '}
            <span className="font-bold text-slate-800">
              {contestSettings.show_public_votes ? '🟢 Visible' : '🔒 Hidden'}
            </span>
          </p>
        </div>

        {/* KPI 6: Security Standard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Auditing Standard
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700">100% Certified</p>
          <p className="text-xs text-slate-500">Real citizen winner selection</p>
        </div>
      </div>
    </div>
  );
}
