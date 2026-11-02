import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth/admin-session';
import { NominationModerationQueue } from '@/features/admin/components/NominationModerationQueue';
import { getPanelById, ADMIN_PANELS } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Video Moderation Queue — Cultural Committee',
  description: 'Review and approve submitted Adivasi performance videos for public voting.',
};

export default async function AdminNominationsPage() {
  const session = await getAdminSession();
  const admin = createAdminClient();

  const isSuperAdmin = session?.role === 'super_admin';
  const isCoAdmin = session?.role === 'co_admin';
  const isPanelAdmin = session?.role === 'panel_admin';
  const assignedPanelId = session?.assignedPanel || 1;
  const panelConfig = getPanelById(assignedPanelId);

  // Build query
  let query = admin
    .from('nominations')
    .select(`
      id,
      title,
      description,
      status,
      category_id,
      sub_category,
      rejection_count,
      is_disqualified,
      reviewer_notes,
      rejection_reason,
      submitted_at,
      upload_record:upload_records(public_url),
      category:contest_categories(id, name, slug),
      artist:artist_profiles(id, stage_name, full_name, state, district, language, experience_years, bio, avatar_url, phone, email)
    `)
    .in('status', ['submitted', 'under_review', 'correction_required', 'rejected', 'approved'])
    .order('submitted_at', { ascending: false });

  // If panel admin, filter by assigned panel categories
  if (isPanelAdmin && panelConfig) {
    query = query.in('category_id', panelConfig.categoryIds as string[]);
  }

  const { data: nominations } = await query;

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            {isSuperAdmin
              ? 'Super Admin Master Moderation Desk'
              : isCoAdmin
              ? 'Co-Admin Review Hub'
              : `Panel ${assignedPanelId} Verification Desk`}
          </span>
          {isPanelAdmin && panelConfig && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0f2d59] border border-blue-200">
              {panelConfig.name}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
          Video Moderation &amp; Verification Desk
        </h1>

        <p className="text-xs sm:text-sm text-slate-600">
          {isPanelAdmin && panelConfig
            ? `Evaluate nominations assigned to ${panelConfig.name}. Review cultural criteria, duration (30-60s / 1 min), file size (up to 100MB), and word count (min 5 words). Max 3 evaluation attempts.`
            : 'Evaluate submitted performance recordings across all 8 award categories. You have master authorization to approve, request corrections, or permanently delete records.'}
        </p>
      </div>

      <NominationModerationQueue
        initialNominations={nominations || []}
        sessionRole={session?.role || 'panel_admin'}
        assignedPanel={assignedPanelId}
      />
    </div>
  );
}
