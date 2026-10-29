import { createAdminClient } from '@/lib/supabase/admin';
import { NominationModerationQueue } from '@/features/admin/components/NominationModerationQueue';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Video Moderation Queue — Cultural Committee',
  description: 'Review and approve submitted Adivasi performance videos for public voting.',
};

export default async function AdminNominationsPage() {
  const admin = createAdminClient();

  // Fetch pending nominations
  const { data: nominations } = await admin
    .from('nominations')
    .select(`
      id,
      title,
      description,
      status,
      reviewer_notes,
      rejection_reason,
      submitted_at,
      upload_record:upload_records(public_url),
      category:contest_categories(name),
      artist:artist_profiles(id, stage_name, full_name, state, district, language, experience_years, bio)
    `)
    .in('status', ['submitted', 'under_review', 'correction_required'])
    .order('submitted_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-ivory-300 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Cultural Committee Review
        </span>
        <h1 className="text-3xl font-extrabold text-charcoal-900">
          Video Moderation Queue
        </h1>
        <p className="text-sm text-charcoal-600">
          Evaluate submitted performance recordings for cultural authenticity, audio/video fidelity, and community representation.
        </p>
      </div>

      <NominationModerationQueue initialNominations={nominations || []} />
    </div>
  );
}
