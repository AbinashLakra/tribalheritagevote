import Link from 'next/link';
import { ArrowRight, Award, Video, ShieldCheck, Heart, Sparkles, MapPin, Users, HelpCircle, FileText } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { CountdownTimer } from '@/components/shared/CountdownTimer';
import { StatCard } from '@/components/shared/StatCard';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Home — National Adivasi Artists Showcase & Online Voting',
  description: 'Vote for India’s finest Adivasi artists, dancers, singers, and craftsmen. Based in Rourkela, Odisha.',
};

export default async function HomePage() {
  const admin = createAdminClient();

  // Fetch active contest
  const { data: contest } = await admin
    .from('contests')
    .select('*')
    .in('status', ['scheduled', 'open', 'paused', 'closed', 'finalized'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch featured approved nominations
  const contestId = contest?.id || 'a1111111-1111-1111-1111-111111111111';
  const { data: featuredNominations } = await admin
    .from('nominations')
    .select(`
      id,
      title,
      vote_count,
      category:contest_categories(name, slug),
      artist:artist_profiles(id, stage_name, state, district, primary_category)
    `)
    .eq('contest_id', contestId)
    .eq('status', 'approved')
    .order('vote_count', { ascending: false })
    .limit(4);

  // Contest countdown target
  const targetDate = contest?.voting_end_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const isVotingOpen = contest?.status === 'open';

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-forest-900 via-forest-800 to-forest-950 text-white overflow-hidden tribal-pattern-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-700/80 border border-forest-500/30 text-ivory-200 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Rourkela, Sundargarh, Odisha • All-India Initiative</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Celebrating India&rsquo;s Authentic{' '}
              <span className="text-terracotta-400">Adivasi Artists</span> &amp; Cultural Heritage
            </h1>

            <p className="text-lg md:text-xl text-ivory-200 font-normal leading-relaxed">
              Experience the untamed rhythm of traditional tribal dances, ancestral melodies, sacred Sohrai paintings, and indigenous crafts. Support authentic folk artists through democratic citizen voting.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/artists"
                className="px-8 py-3.5 bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Browse &amp; Vote Artists
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/artist/nomination"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-ivory-100 border border-white/20 font-semibold rounded-xl backdrop-blur-xs transition-colors flex items-center gap-2"
              >
                <Video className="w-4 h-4 text-terracotta-300" />
                Nominate Yourself
              </Link>

              <Link
                href="/leaderboard"
                className="px-6 py-3.5 bg-forest-800/80 hover:bg-forest-700 text-ivory-200 border border-forest-600/50 font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-terracotta-400" />
                Live Leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Earth Wave Border */}
        <div className="absolute bottom-0 inset-x-0 h-6 bg-ivory-50 clip-path-wave" />
      </section>

      {/* Contest Status & Countdown Milestone */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-ivory-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
              <span className="w-2 h-2 rounded-full bg-forest-600 animate-ping" />
              {isVotingOpen ? 'Voting Is Live Now' : 'Contest Milestone'}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-charcoal-900">
              {contest?.title || 'National Adivasi Cultural Arts Awards 2026'}
            </h2>
            <p className="text-sm text-charcoal-600">
              {isVotingOpen
                ? 'Cast your vote before the official deadline. Strictly 1 verified vote per citizen.'
                : 'Stay tuned as voting dates are updated.'}
            </p>
          </div>

          <CountdownTimer
            targetDate={targetDate}
            label={isVotingOpen ? 'Voting Closes In' : 'Voting Starts In'}
          />
        </div>
      </section>

      {/* Cultural Pillars / Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
            Rich Traditions
          </span>
          <h2 className="text-3xl font-extrabold text-charcoal-900">Cultural Art Categories</h2>
          <p className="text-sm text-charcoal-600">
            Recognizing master practitioners across indigenous music, dance, painting, and craft disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ART_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/artists?category=${cat.slug}`}
              className="p-6 rounded-2xl bg-white border border-ivory-300 hover:border-forest-600 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-lg group-hover:bg-forest-700 group-hover:text-white transition-colors">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-ivory-200 flex items-center justify-between text-xs font-semibold text-forest-700">
                <span>View Nominations</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Artists Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ivory-300 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
              Jury Approved
            </span>
            <h2 className="text-3xl font-extrabold text-charcoal-900">Featured Artists</h2>
            <p className="text-sm text-charcoal-600 mt-1">
              Watch performances and support the custodians of tribal heritage.
            </p>
          </div>
          <Link
            href="/artists"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-800"
          >
            Explore All Artists
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredNominations && featuredNominations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredNominations.map((nom) => {
              const artist = nom.artist as {
                id?: string;
                stage_name?: string;
                state?: string;
                district?: string;
                primary_category?: string;
              } | null;

              const category = nom.category as { name?: string; slug?: string } | null;

              return (
                <div
                  key={nom.id}
                  className="bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-video bg-charcoal-900 relative flex items-center justify-center text-ivory-300">
                    <Video className="w-10 h-10 opacity-70" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-semibold text-white">
                      {category?.name || 'Tribal Art'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-charcoal-900 line-clamp-1">
                        {artist?.stage_name || 'Traditional Artist'}
                      </h3>
                      <p className="text-xs text-charcoal-600 font-medium line-clamp-1 mt-0.5">
                        &ldquo;{nom.title}&rdquo;
                      </p>
                      <p className="text-xs text-forest-700 font-semibold mt-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {artist?.state}, {artist?.district}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-charcoal-600">
                        {nom.vote_count} Votes
                      </span>
                      <Link
                        href={`/artists/${artist?.id || nom.id}`}
                        className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Watch &amp; Vote
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-ivory-300 space-y-3">
            <Award className="w-12 h-12 text-forest-700 mx-auto" />
            <h3 className="text-lg font-bold text-charcoal-900">Nominations Under Evaluation</h3>
            <p className="text-sm text-charcoal-600 max-w-md mx-auto">
              Our cultural review committee is currently moderating performance videos. Approved artists will be showcased here shortly.
            </p>
            <Link
              href="/artist/nomination"
              className="inline-block px-6 py-2.5 bg-forest-700 text-white rounded-lg text-sm font-semibold hover:bg-forest-800 transition-colors"
            >
              Submit Your Performance
            </Link>
          </div>
        )}
      </section>

      {/* Integrity & One-Vote Rule Assurance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-900 text-white rounded-3xl p-8 md:p-14 relative overflow-hidden tribal-pattern-bg">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-terracotta-400">
              National Fair Voting Standard
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              One Citizen. One Verified Mobile. One Vote.
            </h2>
            <p className="text-ivory-200 text-sm md:text-base leading-relaxed">
              To preserve the integrity and dignity of our indigenous artists, voting is secured via mandatory mobile OTP verification and enforced at the PostgreSQL database constraint level. Every vote is immutable and transparently auditable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-ivory-100 font-semibold">
                <ShieldCheck className="w-5 h-5 text-terracotta-400 shrink-0" />
                <span>Zero Duplicate Votes</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-ivory-100 font-semibold">
                <ShieldCheck className="w-5 h-5 text-terracotta-400 shrink-0" />
                <span>Encrypted Phone Privacy</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-ivory-100 font-semibold">
                <ShieldCheck className="w-5 h-5 text-terracotta-400 shrink-0" />
                <span>Independent Committee Audit</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
