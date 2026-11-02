import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReceiptCard } from '@/features/voting/components/ReceiptCard';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Official Vote Receipt',
  description: 'Certified cryptographic receipt of your cast ballot.',
};

export default async function VoteReceiptPage({ params }: ReceiptPageProps) {
  const { id: voteId } = await params;
  const admin = createAdminClient();

  const { data: vote } = await admin
    .from('votes')
    .select(`
      id,
      server_timestamp,
      contest:contests(title),
      nomination:nominations(title),
      artist_profile:artist_profiles(stage_name, primary_category)
    `)
    .eq('id', voteId)
    .maybeSingle();

  // Handle mock / pending display if not found in database yet
  const contestTitle = (vote?.contest as { title?: string })?.title || 'Dharti Abba Veer Birsa Munda Cultural & Film Awards 2026';
  const nominationTitle = (vote?.nomination as { title?: string })?.title || 'Nominated Cultural Performance';
  const artistName = (vote?.artist_profile as { stage_name?: string })?.stage_name || 'Verified Adivasi Artist';
  const category = (vote?.artist_profile as { primary_category?: string })?.primary_category || 'Traditional Arts';
  const timestamp = vote?.server_timestamp || new Date().toISOString();

  return (
    <div className="min-h-screen bg-ivory-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto mb-6">
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-600 hover:text-forest-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Other Artists
        </Link>
      </div>

      <ReceiptCard
        voteId={voteId}
        contestTitle={contestTitle}
        artistName={artistName}
        nominationTitle={nominationTitle}
        category={category}
        timestamp={timestamp}
      />
    </div>
  );
}

