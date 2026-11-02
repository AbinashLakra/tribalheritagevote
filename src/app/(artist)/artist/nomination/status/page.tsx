import Link from 'next/link';
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Video, ShieldAlert, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VideoPlayer } from '@/components/shared/VideoPlayer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nomination Review Status — Artist Dashboard',
  description: 'Track the cultural moderation status and panel feedback of your submitted entry.',
};

export default async function NominationStatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let nomination = null;
  let videoUrl = null;

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('artist_profiles')
      .select('id, stage_name, full_name, phone, state, district')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      const { data: nom } = await admin
        .from('nominations')
        .select('*, upload_record:upload_records(public_url, object_key), category:contest_categories(name)')
        .eq('artist_profile_id', profile.id)
        .maybeSingle();

      nomination = nom;
      if (nom?.upload_record?.public_url) {
        videoUrl = nom.upload_record.public_url;
      }
    }
  }

  const strikes = nomination?.rejection_count || 0;
  const isDisqualified = nomination?.is_disqualified || false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-600 hover:text-forest-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Artist Dashboard
      </Link>

      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
        <div>
          <span className="text-xs uppercase font-extrabold text-amber-600 tracking-wider">
            Nomination Review Status
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            {nomination?.title || 'No Active Nomination Found'}
          </h1>
          {nomination?.category && (
            <p className="text-sm text-slate-600 mt-1 font-semibold">
              Category: <span className="text-[#0f2d59]">{nomination.category.name}</span>
            </p>
          )}
        </div>

        {nomination ? (
          <div className="space-y-6">
            {/* Status Indicator Banner */}
            <div
              className={`p-5 rounded-2xl border flex items-start gap-4 ${
                nomination.status === 'approved'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : isDisqualified
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : nomination.status === 'rejected' || nomination.status === 'correction_required'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0">
                {nomination.status === 'approved' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : isDisqualified ? (
                  <ShieldAlert className="w-7 h-7 text-red-600" />
                ) : nomination.status === 'rejected' || nomination.status === 'correction_required' ? (
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                ) : (
                  <Clock className="w-7 h-7 text-blue-600" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-base capitalize">
                    {isDisqualified
                      ? 'Status: Disqualified'
                      : nomination.status === 'approved'
                      ? 'Status: Approved & Live for Voting'
                      : nomination.status === 'correction_required'
                      ? 'Status: Action Required (Correction Requested)'
                      : `Status: ${nomination.status.replace('_', ' ')}`}
                  </h3>

                  {/* 3 Strikes Pill */}
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      isDisqualified
                        ? 'bg-red-600 text-white border-red-700'
                        : strikes > 0
                        ? 'bg-amber-200 text-amber-950 border-amber-400'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    Strike {strikes} / 3 Max
                  </span>
                </div>

                <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                  {nomination.status === 'approved'
                    ? 'Congratulations! Your cultural video nomination has been approved by the assigned Admin Verification Panel. It is now actively featured in public voting.'
                    : isDisqualified
                    ? 'Your nomination has been disqualified after 3 unsuccessful review evaluations and cannot be resubmitted.'
                    : nomination.status === 'correction_required' || nomination.status === 'rejected'
                    ? `The panel requested adjustments. You have ${3 - strikes} attempt(s) remaining before automatic disqualification.`
                    : 'Your performance video recording is currently queued for jury panel review. Evaluation criteria includes video duration (30-60s / 1 min), file size (up to 100MB), and cultural description.'}
                </p>
              </div>
            </div>

            {/* Committee Notes / Rejection Reason Display */}
            {(nomination.reviewer_notes || nomination.rejection_reason) && (
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-300 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Admin Panel Evaluation Feedback:
                </h4>
                <p className="text-xs sm:text-sm text-amber-950 whitespace-pre-wrap leading-relaxed font-medium">
                  {nomination.reviewer_notes || nomination.rejection_reason}
                </p>
              </div>
            )}

            {/* Video Preview */}
            {videoUrl && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  Submitted Performance Video Recording
                </h4>
                <div className="rounded-2xl overflow-hidden border border-slate-300 aspect-video bg-black shadow-inner">
                  <VideoPlayer src={videoUrl} title={nomination.title} />
                </div>
              </div>
            )}

            {/* Resubmission Button (if not disqualified and corrections required) */}
            {!isDisqualified && (nomination.status === 'correction_required' || nomination.status === 'rejected') && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-600">
                  Address the panel feedback above, ensure your video strictly matches criteria (30-60s duration / 1 min, up to 100MB size, min 5 words description), and submit updated entry.
                </p>
                <Link
                  href="/artist/nomination"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2d59] hover:bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  Edit &amp; Resubmit Performance
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-600 text-sm">You have not submitted a nomination yet.</p>
            <Link
              href="/artist/nomination"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2d59] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Submit Your First Nomination
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
