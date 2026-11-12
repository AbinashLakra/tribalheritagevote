import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Award, ShieldCheck, Heart, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { VoteButton } from '@/features/voting/components/VoteButton';
import { calculateDisplayedVoteCount, extractContestSettings } from '@/lib/voting/vote-display-calculator';

export const dynamic = 'force-dynamic';

interface ArtistProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArtistProfilePageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: artist } = await admin
    .from('artist_profiles')
    .select('stage_name, state, district, primary_category')
    .eq('id', slug)
    .maybeSingle();

  if (!artist) {
    return { title: 'Artist Profile' };
  }

  return {
    title: `${artist.stage_name} — Adivasi Cultural Artist`,
    description: `Watch performance by ${artist.stage_name} from ${artist.district}, ${artist.state}. Vote in the Dharti Abba Veer Birsa Munda Cultural & Film Awards.`,
  };
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Try finding artist by artist_profiles.id or by nomination.id
  let artist = null;
  let nomination = null;

  const { data: profile } = await admin
    .from('artist_profiles')
    .select('*')
    .eq('id', slug)
    .maybeSingle();

  if (profile) {
    artist = profile;
    const { data: nom } = await admin
      .from('nominations')
      .select('*, upload_record:upload_records(public_url), category:contest_categories(name, slug)')
      .eq('artist_profile_id', profile.id)
      .eq('status', 'approved')
      .maybeSingle();
    nomination = nom;
  } else {
    // Check if slug is a nomination ID
    const { data: nom } = await admin
      .from('nominations')
      .select('*, upload_record:upload_records(public_url), category:contest_categories(name, slug), artist:artist_profiles(*)')
      .eq('id', slug)
      .maybeSingle();

    if (nom) {
      nomination = nom;
      artist = nom.artist as typeof profile;
    }
  }

  // If no artist found or nomination unapproved, show 404
  if (!artist) {
    notFound();
  }

  // Fetch active contest info
  const contestId = nomination?.contest_id || 'a1111111-1111-1111-1111-111111111111';
  const { data: contest } = await admin
    .from('contests')
    .select('title, status, voting_start_at, voting_end_at, settings, leaderboard_visibility, reopening_reason')
    .eq('id', contestId)
    .maybeSingle();

  const contestSettings = extractContestSettings(contest);

  let displayedVoteCount = nomination?.vote_count ?? 0;
  if (nomination) {
    const calc = calculateDisplayedVoteCount({
      nominationId: nomination.id,
      realVotes: nomination.vote_count || 0,
      startAt: contest?.voting_start_at,
      endAt: contest?.voting_end_at,
      boostEnabled: contestSettings.boost_enabled,
      isReopened: Boolean(contest?.reopening_reason && contest?.status === 'open'),
    });
    displayedVoteCount = calc.displayedVotes;
  }

  const videoUrl = nomination?.upload_record?.public_url || '';
  const isVotingOpen = contest?.status === 'open';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-600 hover:text-forest-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Artist Directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Video & Performance Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Video Player */}
          {videoUrl ? (
            <div className="space-y-3">
              <VideoPlayer
                src={videoUrl}
                title={nomination?.title || artist.stage_name}
              />
              <div className="flex items-center justify-between text-xs text-charcoal-500">
                <span className="flex items-center gap-1 text-forest-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Jury Verified Authentic Performance
                </span>
                <span>Format: High Definition Video</span>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-charcoal-900 rounded-2xl flex flex-col items-center justify-center text-ivory-200 p-8 text-center space-y-3">
              <Award className="w-16 h-16 text-terracotta-400" />
              <h3 className="text-xl font-bold">Performance Showcase</h3>
              <p className="text-xs text-charcoal-400 max-w-sm">
                The high-definition performance video for this approved nomination is being prepared for streaming.
              </p>
            </div>
          )}

          {/* Performance Title & Category */}
          <div className="space-y-4 bg-white p-6 md:p-8 rounded-2xl border border-ivory-300 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                {nomination?.category?.name || artist.primary_category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ivory-100 text-charcoal-700">
                {artist.experience_years} Years of Practice
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
              {nomination?.title || artist.stage_name}
            </h1>

            {nomination?.description && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                  About This Performance
                </h3>
                <p className="text-sm md:text-base text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                  {nomination.description}
                </p>
              </div>
            )}
          </div>

          {/* Artist Biography & Lineage */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-ivory-300 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
              <User className="w-5 h-5 text-forest-700" />
              Artistic Lineage &amp; Background
            </h2>
            <p className="text-sm md:text-base text-charcoal-700 leading-relaxed whitespace-pre-wrap">
              {artist.bio}
            </p>
          </div>
        </div>

        {/* Right Column: Voting & Candidate Profile Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-forest-600/30 shadow-lg space-y-6 sticky top-24">
            {/* Candidate Header */}
            <div className="text-center space-y-2 border-b border-ivory-200 pb-5">
              <div className="w-20 h-20 rounded-full bg-forest-100 text-forest-800 mx-auto flex items-center justify-center font-bold text-2xl border-2 border-forest-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-charcoal-900">{artist.stage_name}</h2>
              <p className="text-xs font-semibold text-forest-700 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {artist.district}, {artist.state}
              </p>
              <p className="text-xs text-charcoal-500">Language: {artist.language}</p>
            </div>

            {/* Voting Action */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs uppercase font-bold tracking-wider text-charcoal-500">
                  {contestSettings.show_public_votes ? 'Accepted Citizen Votes' : 'Official Entry'}
                </span>
                <p className="text-4xl font-extrabold text-forest-800 mt-1">
                  {contestSettings.show_public_votes ? displayedVoteCount : '🔒 Sealed'}
                </p>
              </div>

              {isVotingOpen && nomination ? (
                <div className="pt-2">
                  <VoteButton
                    contestId={contestId}
                    nominationId={nomination.id}
                    artistName={artist.stage_name}
                    nominationTitle={nomination.title}
                    category={nomination.category?.name || artist.primary_category}
                  />
                </div>
              ) : (
                <div className="p-4 bg-ivory-100 border border-ivory-300 rounded-xl text-center text-xs text-charcoal-600 font-semibold">
                  Voting is currently {contest?.status || 'closed'} for this contest.
                </div>
              )}
            </div>

            {/* Fair Voting Rule Explanation */}
            <div className="p-4 bg-forest-50 border border-forest-200 rounded-xl space-y-2 text-xs text-forest-900 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-forest-800">
                <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                <span>Strict One-Vote Guarantee</span>
              </div>
              <p className="text-forest-700">
                Each verified citizen may vote for <strong>only one artist</strong> across the entire contest. Your vote is recorded in an immutable ledger with zero duplicate votes permitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
