import Link from 'next/link';
import { Award, Trophy, MapPin, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { INDIAN_STATES } from '@/lib/constants/states';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live Citizen Leaderboard',
  description: 'Track real-time verified citizen votes across Indian states and cultural art categories.',
};

interface LeaderboardPageProps {
  searchParams: Promise<{
    state?: string;
    category?: string;
  }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { state = '', category = '' } = await searchParams;
  const admin = createAdminClient();

  // Fetch active contest
  const { data: contest } = await admin
    .from('contests')
    .select('id, title, status, leaderboard_visibility, results_published')
    .in('status', ['open', 'paused', 'closed', 'finalized'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const contestId = contest?.id || 'a1111111-1111-1111-1111-111111111111';

  // Call PostgreSQL RPC get_leaderboard
  const { data: leaderboardData } = await admin.rpc('get_leaderboard', {
    p_contest_id: contestId,
    p_state: state || null,
    p_limit: 50,
    p_offset: 0,
  });

  const isVisible = (leaderboardData as { visible?: boolean })?.visible ?? true;
  const message = (leaderboardData as { message?: string })?.message;
  const rawEntries = (leaderboardData as { entries?: unknown[] })?.entries || [];

  interface Entry {
    rank: number;
    nomination_id: string;
    nomination_title: string;
    artist_profile_id: string;
    stage_name: string;
    state: string;
    district: string;
    category_name: string;
    vote_count: number;
  }

  const entries = rawEntries as Entry[];
  const topVote = entries[0]?.vote_count || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-ivory-300 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Transparent Tally
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Live Contest Leaderboard
        </h1>
        <p className="text-sm md:text-base text-charcoal-600 max-w-2xl">
          {contest?.title || 'Dharti Abba Veer Birsa Munda Cultural & Film Awards 2026'} • Ranked by verified non-duplicate citizen votes.
        </p>
      </div>

      {/* State Filter */}
      <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <form method="GET" className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
              Filter by State
            </label>
            <select
              name="state"
              defaultValue={state}
              className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 text-sm bg-white text-charcoal-900 outline-none focus:border-forest-600"
            >
              <option value="">All Indian States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-5">
            <button
              type="submit"
              className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Visibility Check */}
      {!isVisible ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-ivory-300 space-y-4">
          <div className="w-16 h-16 rounded-full bg-ivory-100 text-charcoal-600 flex items-center justify-center mx-auto">
            <EyeOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal-900">
            Leaderboard Visibility Restricted
          </h2>
          <p className="text-sm text-charcoal-600 max-w-md mx-auto">
            {message || 'The administrator has restricted real-time leaderboard visibility during the active voting phase to protect fair competition.'}
          </p>
          <Link
            href="/artists"
            className="inline-block px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Explore Artists
          </Link>
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-6">
          {/* Top 3 Visual Podiums */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entries.slice(0, 3).map((entry, idx) => {
              const medalColor =
                idx === 0
                  ? 'border-amber-400 bg-amber-50/60'
                  : idx === 1
                  ? 'border-slate-300 bg-slate-50/60'
                  : 'border-amber-700/40 bg-amber-900/5';

              return (
                <div
                  key={entry.nomination_id}
                  className={`p-6 rounded-2xl border-2 ${medalColor} space-y-4 relative overflow-hidden flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between">
                    <span className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center font-bold text-sm text-charcoal-900 border border-ivory-300">
                      #{idx + 1}
                    </span>
                    <Trophy
                      className={`w-6 h-6 ${
                        idx === 0
                          ? 'text-amber-500'
                          : idx === 1
                          ? 'text-slate-400'
                          : 'text-amber-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-charcoal-900 line-clamp-1">
                      {entry.stage_name}
                    </h3>
                    <p className="text-xs text-charcoal-600 font-medium line-clamp-1">
                      &ldquo;{entry.nomination_title}&rdquo;
                    </p>
                    <p className="text-xs text-forest-700 font-semibold flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {entry.state}, {entry.district}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-ivory-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-500">
                        Accepted Votes
                      </span>
                      <p className="text-xl font-extrabold text-charcoal-900">
                        {entry.vote_count}
                      </p>
                    </div>
                    <Link
                      href={`/artists/${entry.artist_profile_id}`}
                      className="text-xs font-semibold text-forest-700 hover:underline flex items-center gap-1"
                    >
                      Profile <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Ranked Table with Bar Visual */}
          <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory-100/70 border-b border-ivory-300 text-xs font-bold text-charcoal-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Rank</th>
                    <th className="py-3.5 px-4">Artist / Troupe</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">State &amp; District</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Votes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 text-sm">
                  {entries.map((entry) => {
                    const percentage = Math.max(5, Math.round((entry.vote_count / topVote) * 100));

                    return (
                      <tr key={entry.nomination_id} className="hover:bg-ivory-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-charcoal-900">
                          #{entry.rank}
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/artists/${entry.artist_profile_id}`}
                            className="font-bold text-charcoal-900 hover:text-forest-700 block line-clamp-1"
                          >
                            {entry.stage_name}
                          </Link>
                          <span className="text-xs text-charcoal-500 line-clamp-1">
                            &ldquo;{entry.nomination_title}&rdquo;
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-charcoal-700 hidden sm:table-cell">
                          {entry.state}, {entry.district}
                        </td>
                        <td className="py-4 px-4 text-xs text-charcoal-700 hidden md:table-cell">
                          {entry.category_name}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right font-extrabold text-charcoal-900">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-2 bg-ivory-200 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-forest-700 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span>{entry.vote_count}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-2xl border border-ivory-300 space-y-3">
          <Award className="w-12 h-12 text-forest-700 mx-auto" />
          <h3 className="text-lg font-bold text-charcoal-900">No Votes Recorded Yet</h3>
          <p className="text-sm text-charcoal-600 max-w-md mx-auto">
            Be the first verified citizen to support an authentic Adivasi cultural artist.
          </p>
          <Link
            href="/artists"
            className="inline-block px-6 py-2.5 bg-forest-700 text-white rounded-lg text-sm font-semibold hover:bg-forest-800 transition-colors"
          >
            Browse Artists
          </Link>
        </div>
      )}
    </div>
  );
}
