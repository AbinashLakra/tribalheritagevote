import { createAdminClient } from '@/lib/supabase/admin';
import { ContestControlPanel } from '@/features/admin/components/ContestControlPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contest Lifecycle & Voting Controls',
  description: 'Manage voting schedules, emergency pause, close, and auditable reopening.',
};

export default async function AdminContestPage() {
  const admin = createAdminClient();

  const { data: contest } = await admin
    .from('contests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no contest found, provide fallback defaults
  const currentContest = contest || {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'Dharti Abba Veer Birsa Munda Cultural & Film Awards 2026',
    slug: 'national-adivasi-awards-2026',
    description: 'Celebrating authentic Adivasi artists across India, hosted in Rourkela, Odisha.',
    status: 'open',
    nomination_start_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    nomination_end_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    voting_start_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    voting_end_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    leaderboard_visibility: 'live',
    results_published: false,
    reopening_reason: null,
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-1 border-b border-ivory-300 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          State Machine
        </span>
        <h1 className="text-3xl font-extrabold text-charcoal-900">
          Contest Lifecycle &amp; Voting Controls
        </h1>
        <p className="text-sm text-charcoal-600">
          Open, pause, close, or reopen voting with mandatory audit trails.
        </p>
      </div>

      <ContestControlPanel contest={currentContest} />
    </div>
  );
}
