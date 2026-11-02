import { createAdminClient } from '@/lib/supabase/admin';
import { NominationForm } from '@/features/nominations/components/NominationForm';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dharti Abba Veer Birsa Munda — Official Artist Nomination Form',
  description: 'Submit your cultural performance video for the 8 official Nagpuri & Adivasi Award Categories.',
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

  // Fetch categories for this contest from database
  const { data: categories } = await admin
    .from('contest_categories')
    .select('id, name, slug')
    .eq('contest_id', contestId)
    .order('display_order', { ascending: true });

  const categoryOptions =
    categories && categories.length > 0
      ? categories
      : ART_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f2d59] tracking-tight">
          Dharti Abba Veer Birsa Munda
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-amber-600 uppercase tracking-wider">
          Cultural &amp; Film Awards 2026 • Official Artist Nomination Form
        </p>
        <p className="text-sm text-slate-600">
          Select from the 8 official competition categories below and upload your video recording directly to Cloudflare R2 storage for jury committee review and public voting.
        </p>
      </div>

      <NominationForm contestId={contestId} categories={categoryOptions} />
    </div>
  );
}
