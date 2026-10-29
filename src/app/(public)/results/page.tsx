import Link from 'next/link';
import { Award, Trophy, CheckCircle2, Calendar, FileText, ArrowLeft, ShieldCheck } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateIST } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Official Certified Results',
  description: 'Certified national results snapshots for the Adivasi Cultural Arts Awards.',
};

export default async function ResultsPage() {
  const admin = createAdminClient();

  // Fetch finalized contest with results published
  const { data: contest } = await admin
    .from('contests')
    .select('*')
    .eq('results_published', true)
    .order('voting_end_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let snapshot = null;
  if (contest) {
    const { data: snap } = await admin
      .from('result_snapshots')
      .select('*')
      .eq('contest_id', contest.id)
      .maybeSingle();
    snapshot = snap;
  }

  interface SnapshotEntry {
    rank: number;
    artistName: string;
    nominationTitle: string;
    category: string;
    state: string;
    district: string;
    totalVotes: number;
  }

  const rawEntries = (snapshot?.snapshot_data as { entries?: SnapshotEntry[] })?.entries || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-600 hover:text-forest-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Homepage
        </Link>
      </div>

      <div className="space-y-2 border-b border-ivory-300 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Official Declaration
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Certified Contest Results
        </h1>
        <p className="text-sm md:text-base text-charcoal-600 max-w-2xl">
          Immutable cryptographic result snapshots sealed upon conclusion of voting and verified by the cultural jury.
        </p>
      </div>

      {contest && snapshot ? (
        <div className="space-y-8">
          {/* Certificate Header */}
          <div className="bg-forest-900 text-white rounded-3xl p-8 md:p-12 space-y-4 tribal-pattern-bg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-800 text-ivory-200 text-xs font-bold uppercase">
              <ShieldCheck className="w-4 h-4 text-terracotta-400" />
              Certified Final Result
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold">{contest.title}</h2>
            <div className="flex flex-wrap items-center gap-6 text-xs text-ivory-200 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Published: {formatDateIST(snapshot.published_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-400" />
                Total Accepted Votes: {snapshot.total_votes}
              </span>
              <span className="font-mono text-[11px] bg-forest-950/60 px-2.5 py-1 rounded">
                SHA-256: {snapshot.checksum_sha256.slice(0, 16)}...
              </span>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory-100/70 border-b border-ivory-300 text-xs font-bold text-charcoal-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Standing</th>
                    <th className="py-3.5 px-4">Artist / Ensemble</th>
                    <th className="py-3.5 px-4">State &amp; District</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Official Tally</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 text-sm">
                  {rawEntries.map((e, index) => (
                    <tr key={index} className="hover:bg-ivory-50/60">
                      <td className="py-4 px-4 sm:px-6 font-bold text-charcoal-900">
                        #{e.rank}
                      </td>
                      <td className="py-4 px-4 font-bold text-charcoal-900">
                        {e.artistName}
                        <span className="block text-xs font-normal text-charcoal-500">
                          &ldquo;{e.nominationTitle}&rdquo;
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-charcoal-700">
                        {e.district}, {e.state}
                      </td>
                      <td className="py-4 px-4 text-xs text-charcoal-700">
                        {e.category}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right font-extrabold text-charcoal-900">
                        {e.totalVotes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-ivory-300 space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal-900">
            Contest Is Currently Active
          </h2>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            Official certified results snapshots are published here after voting concludes, all votes are audited, and the cultural committee seals the final ledger.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/leaderboard"
              className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              View Live Leaderboard
            </Link>
            <Link
              href="/artists"
              className="px-6 py-2.5 border border-ivory-400 hover:bg-ivory-100 text-charcoal-700 font-semibold rounded-lg text-sm transition-colors"
            >
              Browse Nominated Artists
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
