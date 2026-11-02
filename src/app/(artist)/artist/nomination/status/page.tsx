import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Video,
  ShieldAlert,
  Award,
  User,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getArtistSession } from '@/lib/auth/artist-session';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { ArtistLogoutButton } from '@/features/artists/components/ArtistLogoutButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nomination Review Status — Artist Dashboard',
  description: 'Track the cultural moderation status, jury feedback, and review strikes of your submitted entry.',
};

export default async function NominationStatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let nomination = null;
  let videoUrl = null;

  const admin = createAdminClient();

  // 1. Try resolving profile from Supabase Auth
  if (user) {
    const { data: p } = await admin
      .from('artist_profiles')
      .select('id, stage_name, full_name, phone, state, district')
      .eq('user_id', user.id)
      .maybeSingle();
    profile = p;
  }

  // 2. Try resolving profile from signed artist session cookie
  if (!profile) {
    const session = await getArtistSession();
    if (session?.artistProfileId) {
      const { data: p } = await admin
        .from('artist_profiles')
        .select('id, stage_name, full_name, phone, state, district')
        .eq('id', session.artistProfileId)
        .maybeSingle();
      profile = p;
    }
  }

  // 3. If profile resolved, query active nomination
  if (profile) {
    const { data: nom } = await admin
      .from('nominations')
      .select('*, upload_record:upload_records(public_url, object_key), category:contest_categories(name)')
      .eq('artist_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    nomination = nom;
    if (nom?.upload_record?.public_url) {
      videoUrl = nom.upload_record.public_url;
    }
  }

  const strikes = nomination?.rejection_count || 0;
  const isDisqualified = nomination?.is_disqualified || false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0f2d59] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Website</span>
        </Link>

        {profile && <ArtistLogoutButton />}
      </div>

      {!profile ? (
        /* Artist Login Required Prompt */
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-[#0f2d59] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-blue-700" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2d59]">
              Artist Login Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To check your official nomination status, review committee feedback, or resubmit your performance video, please log in with your registered Artist Name or Phone and Password.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/artist/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
            >
              <span>Log In to Artist Desk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/artist/nomination"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>New Artist Registration</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Authenticated Artist Status View */
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
          {/* Artist Identity Header Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900">
                  Authenticated Adivasi Artist
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#0f2d59]">
                {profile.stage_name} {profile.full_name && `(${profile.full_name})`}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  +91 {profile.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.district}, {profile.state}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/artist/nomination"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-blue-200 text-[#0f2d59] font-bold text-xs hover:bg-blue-50 transition-colors shadow-xs"
              >
                <Video className="w-3.5 h-3.5 text-blue-700" />
                <span>Submit / Update Entry</span>
              </Link>
            </div>
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold text-amber-600 tracking-wider">
              Nomination Review Status
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
              {nomination?.title || 'No Performance Submitted Yet'}
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
                        ? 'Status: Criteria Correction Requested (Re-Submit Allowed)'
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
                      Evaluation Strike: {strikes} / 3 Max
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                    {nomination.status === 'approved'
                      ? 'Congratulations! Your cultural video nomination has been approved by the Admin Verification Panel. It is now actively featured in public voting and receiving citizen votes.'
                      : isDisqualified
                      ? 'Your nomination has been disqualified after 3 unsuccessful review evaluations and cannot be resubmitted.'
                      : nomination.status === 'correction_required' || nomination.status === 'rejected'
                      ? `The jury panel requested adjustments. You have ${3 - strikes} attempt(s) remaining before disqualification. Please review the feedback notes below and re-upload your corrected video.`
                      : 'Your performance video recording is currently queued for jury panel review. Evaluation criteria includes video duration (30-60s / 1 min), file size (up to 100MB), and cultural description.'}
                  </p>

                  {nomination.status === 'approved' && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800">
                        Total Citizen Votes Received:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-extrabold text-xs">
                        {nomination.vote_count || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Committee Notes / Rejection Reason Display */}
              {(nomination.reviewer_notes || nomination.rejection_reason) && (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-300 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Jury Committee Instructions &amp; Feedback:
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
              {!isDisqualified &&
                (nomination.status === 'correction_required' || nomination.status === 'rejected') && (
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold uppercase text-[#0f2d59] tracking-wider">
                        Re-Submit Corrected Performance
                      </h4>
                      <p className="text-xs text-slate-600 max-w-lg">
                        Address the panel instructions above (ensure 30-60s length, under 100MB size) and re-upload your recording. You have {3 - strikes} attempt(s) left.
                      </p>
                    </div>

                    <Link
                      href="/artist/nomination"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2d59] hover:bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0 cursor-pointer text-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Re-Submit Video Nomination</span>
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
      )}
    </div>
  );
}
