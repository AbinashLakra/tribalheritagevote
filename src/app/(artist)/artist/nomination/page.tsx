import { createAdminClient } from '@/lib/supabase/admin';
import { NominationForm } from '@/features/nominations/components/NominationForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Submit Nomination Video',
  description: 'Submit your cultural performance video for the National Adivasi Cultural Arts Awards.',
};

export default async function ArtistNominationPage() {
  const admin = createAdminClient();

  // Fetch current active contest
  const { data: contest } = await admin
    .from('contests')
    .select('id, title, status')
    .in('status', ['scheduled', 'open'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback contest ID if none seeded yet
  const contestId = contest?.id || 'a1111111-1111-1111-1111-111111111111';

  // Fetch categories for this contest
  const { data: categories } = await admin
    .from('contest_categories')
    .select('id, name, slug')
    .eq('contest_id', contestId)
    .order('display_order', { ascending: true });

  const categoryOptions = categories && categories.length > 0 ? categories : [
    { id: 'b1111111-1111-1111-1111-111111111111', name: 'Tribal & Folk Dance', slug: 'tribal-dance' },
    { id: 'b2222222-2222-2222-2222-222222222222', name: 'Folk Music & Tribal Vocals', slug: 'folk-music' },
    { id: 'b3333333-3333-3333-3333-333333333333', name: 'Sohrai, Khovar & Tribal Painting', slug: 'traditional-painting' },
    { id: 'b4444444-4444-4444-4444-444444444444', name: 'Indigenous Crafts & Metalwork', slug: 'handicrafts' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-charcoal-900">
          {contest?.title || 'National Adivasi Cultural Arts Awards 2026'}
        </h1>
        <p className="text-sm text-charcoal-600">
          Upload your authentic cultural video directly to Cloudflare R2 storage. Once reviewed and approved by the moderation committee, your performance will appear in the national directory for citizen voting.
        </p>
      </div>

      <NominationForm contestId={contestId} categories={categoryOptions} />
    </div>
  );
}
