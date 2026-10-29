import Link from 'next/link';
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VideoPlayer } from '@/components/shared/VideoPlayer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nomination Review Status',
  description: 'Track the cultural moderation status of your submitted entry.',
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
      .select('id')
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-600 hover:text-forest-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white p-6 md:p-10 rounded-2xl border border-ivory-300 shadow-sm space-y-8">
        <div>
          <span className="text-xs uppercase font-semibold text-terracotta-600 tracking-wider">
            Review Status
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900 mt-1">
            {nomination?.title || 'No Nomination Found'}
          </h1>
          {nomination?.category && (
            <p className="text-sm text-charcoal-600 mt-1">Category: {nomination.category.name}</p>
          )}
        </div>

        {nomination ? (
          <div className="space-y-6">
            {/* Status Indicator Banner */}
            <div
              className={`p-5 rounded-xl border flex items-start gap-4 ${
                nomination.status === 'approved'
                  ? 'bg-forest-50 border-forest-200 text-forest-900'
                  : nomination.status === 'rejected'
                  ? 'bg-terracotta-50 border-terracotta-200 text-terracotta-900'
                  : nomination.status === 'correction_required'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-ivory-100 border-ivory-300 text-charcoal-800'
              }`}
            >
              <div className="p-2 rounded-lg bg-white/80 shrink-0">
                {nomination.status === 'approved' ? (
                  <CheckCircle2 className="w-6 h-6 text-forest-700" />
                ) : nomination.status === 'rejected' ? (
                  <AlertTriangle className="w-6 h-6 text-terracotta-600" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base capitalize">
                  Status: {nomination.status.replace('_', ' ')}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {nomination.status === 'approved'
                    ? 'Congratulations! Your performance has been verified and approved by the cultural moderation committee. It is now live in the national artist directory and open for voting.'
                    : nomination.status === 'under_review' || nomination.status === 'submitted'
                    ? 'Your nomination is currently in the committee review queue. We verify cultural authenticity, audio/video quality, and copyright clearance.'
                    : nomination.status === 'correction_required'
                    ? 'The committee has requested adjustments before your nomination can be published. Please review the notes below and resubmit.'
                    : 'This nomination was rejected. Please refer to committee feedback.'}
                </p>
              </div>
            </div>

            {/* Committee Notes / Feedback */}
            {(nomination.reviewer_notes || nomination.rejection_reason) && (
              <div className="p-5 bg-ivory-50 rounded-xl border border-ivory-300 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Committee Feedback & Notes
                </h4>
                <p className="text-sm text-charcoal-800 whitespace-pre-wrap leading-relaxed">
                  {nomination.reviewer_notes || nomination.rejection_reason}
                </p>
              </div>
            )}

            {/* Video Preview */}
            {videoUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-charcoal-800 flex items-center gap-2">
                  <Video className="w-4 h-4 text-forest-700" />
                  Submitted Performance Video
                </h4>
                <VideoPlayer src={videoUrl} title={nomination.title} />
              </div>
            )}

            {/* Resubmission Action */}
            {nomination.status === 'correction_required' && (
              <div className="pt-4 border-t border-ivory-200">
                <Link
                  href="/artist/nomination"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Edit & Resubmit Performance
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <p className="text-charcoal-600">You have not submitted a nomination yet.</p>
            <Link
              href="/artist/nomination"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg transition-colors"
            >
              Submit Your First Nomination
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
