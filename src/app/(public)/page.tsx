import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Video,
  ShieldCheck,
  Sparkles,
  MapPin,
  Vote,
  Shield,
  CheckCircle2,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { CountdownTimer } from '@/components/shared/CountdownTimer';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tribal Heritage Vote 2026 — Dharti Aaba Veer Birsa Munda Cultural Awards',
  description:
    'All-India Adivasi Artists Nomination, Video Showcase, and Online Voting Platform based in Rourkela, Sundargarh, Odisha.',
};

export default async function HomePage() {
  const admin = createAdminClient();

  // Fetch active or latest contest
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
    <div className="space-y-12 pb-20">
      {/* ── HERO SECTION: 2-COLUMN DESIGN (PROFESSIONAL ENGLISH & BLUE THEME) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ── LEFT COLUMN: MAIN BANNER & MISSION CARD ── */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
            {/* 151st Birth Anniversary Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold tracking-wide uppercase">
              <span className="text-amber-500">★</span>
              <span>151ST BIRTH ANNIVERSARY • ROURKELA, ODISHA</span>
            </div>

            {/* Bold Heading in Deep Royal Blue */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0f2d59] leading-[1.18] font-serif">
              DHARTI AABA VEER BIRSA MUNDA TRIBAL HERITAGE AWARDS 2026
            </h1>

            {/* Cultural Intro Paragraphs in English */}
            <div className="space-y-3 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p>
                Organized to honor the sacred memory of Dharti Aaba Veer Birsa Munda and preserve India&rsquo;s authentic
                Adivasi traditions, this nationwide cultural showcase and digital voting platform celebrates indigenous
                creativity, heritage pride, and folk artistic excellence.
              </p>
              <p>
                Our objective is to empower indigenous youth, master artisans, folk dancers, and vocalists by bringing
                ancestral music, traditional handloom attire, sacred paintings, and heritage crafts to a national stage with
                certified democratic recognition.
              </p>
            </div>

            {/* Mission Points Box */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#0f2d59] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Key Mission Pillars:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>Promoting traditional textile motifs, indigenous handloom, and tribal folk performing arts on a premier national showcase.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>Ensuring democratic integrity through a strict <strong>1 Verified Citizen Mobile = 1 Vote</strong> OTP authentication engine.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>Providing tamper-evident digital auditing, real-time vote distribution graphs, and permanent honors for indigenous artists.</span>
                </li>
              </ul>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
              >
                <span>Explore Nominated Artists</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/rules"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <span>Voting Guidelines &amp; Rules</span>
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN: 4 INTERACTIVE ACTION CARDS (ENGLISH) ── */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* CARD 1: NEW REGISTRATION (ARTIST NOMINATION) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  1. NEW REGISTRATION
                </h3>
                <span className="text-lg">✨</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Adivasi artists, dancers, singers, and craftsmen can submit their official video nomination form for jury evaluation.
              </p>
              <Link
                href="/artist/nomination"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white font-bold py-3 px-4 text-sm shadow transition-all"
              >
                <span>Start Registration</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* CARD 2: ARTIST LOGIN & NOMINATION STATUS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  2. ARTIST LOGIN &amp; STATUS
                </h3>
                <span className="text-lg">🎨</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Already registered? Log in with your Name/Phone &amp; Password to check if your entry is Approved, read Jury instructions, or re-submit adjustments (Up to 3 review attempts).
              </p>
              <Link
                href="/artist/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 text-sm shadow transition-all cursor-pointer"
              >
                <span>Artist Login (Check Status)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* CARD 3: DELEGATE / CITIZEN VOTING (GOLD ACCENT) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  3. DELEGATE / VOTER LOGIN
                </h3>
                <span className="text-lg">🗳️</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Watch approved artist showcases, verify your mobile number via OTP, and cast your verified vote with an instant digital receipt.
              </p>
              <Link
                href="/artists"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-bold py-3 px-4 text-sm shadow transition-all"
              >
                <Vote className="w-4 h-4 text-amber-200" />
                <span>Open Voting Portal</span>
              </Link>
            </div>

            {/* CARD 4: ADMIN LOGIN (NAVY DARK ACCENT) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  4. ADMIN LOGIN
                </h3>
                <span className="text-lg">🛡️</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Authorized organizers: manage contest timelines, review video submissions, control re-opening windows, and inspect audit logs.
              </p>
              <Link
                href="/admin"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-3 px-4 text-sm shadow transition-all"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Admin Portal</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONTEST STATUS & COUNTDOWN MILESTONE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              {isVotingOpen ? 'Voting Is Live Now' : 'Contest Timeline'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {contest?.title || 'Dharti Abba Veer Birsa Munda Cultural & Film Awards 2026'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {isVotingOpen
                ? 'Cast your official ballot before the deadline. Strictly 1 verified citizen mobile = 1 vote.'
                : 'Contest dates are active. Check back for upcoming voting sessions.'}
            </p>
          </div>

          <CountdownTimer
            targetDate={targetDate}
            label={isVotingOpen ? 'Voting Closes In' : 'Voting Starts In'}
          />
        </div>
      </section>

      {/* ── ARTIST STATUS TRACKING & RE-SUBMISSION BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0a1c36] via-[#0f2d59] to-[#1e3a8a] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Artist Portal • 3-Strike Fair Review Guarantee</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Are You a Registered Adivasi Artist? Track Your Nomination
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-2xl">
                Log in to your private Artist Desk to view live Jury moderation status (Approved, Under Review, or Adjustments Required). If the panel requests changes to video criteria (duration 30s-60s, size up to 100MB, cultural background), you have up to 3 evaluation attempts to re-upload your performance recording.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/artist/login"
                className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <span>Artist Login Desk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/artist/nomination"
                className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <span>New Artist Nomination Form</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CULTURAL CATEGORIES SECTION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Official Award Categories (8 Categories)
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
            Nagpuri &amp; Tribal Performing Arts Awards
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Recognizing excellence across 8 official award categories honoring music videos, lead actors, dancers, vocalists, directors, and creative technicians.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ART_CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/artists?category=${cat.slug}`}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-700 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm group-hover:bg-[#0f2d59] group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>View Nominations</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED ARTISTS & VIDEOS SHOWCASE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Verified Entries
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">Featured Adivasi Performers</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Watch performance showcases and vote directly for the authentic custodians of tribal heritage.
            </p>
          </div>
          <Link
            href="/artists"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900"
          >
            <span>Explore All Nominated Artists</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredNominations && featuredNominations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-video bg-slate-900 relative flex items-center justify-center text-slate-300">
                    <Video className="w-10 h-10 opacity-70" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-semibold text-white">
                      {category?.name || 'Tribal Art'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                        {artist?.stage_name || 'Traditional Artist'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                        &ldquo;{nom.title}&rdquo;
                      </p>
                      <p className="text-xs text-blue-800 font-semibold mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        {artist?.state}, {artist?.district}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {nom.vote_count} Votes
                      </span>
                      <Link
                        href={`/artists/${artist?.id || nom.id}`}
                        className="px-3 py-1.5 bg-[#0f2d59] hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition-colors"
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
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Award className="w-10 h-10 text-blue-900 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Nominations Verification In Progress</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Our cultural review committee is currently moderating performance videos. Approved entries will appear live here.
            </p>
            <Link
              href="/artist/nomination"
              className="inline-block px-5 py-2.5 bg-[#0f2d59] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors"
            >
              Submit Your Nomination
            </Link>
          </div>
        )}
      </section>

      {/* ── LIVE LEADERBOARD PREVIEW & AUDITABLE TRANSPARENCY ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0f2d59] rounded-2xl text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left items-center">
            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Auditable Transparency
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Live Leaderboard, Result Graphs &amp; Instant Verification
              </h3>
              <p className="text-xs sm:text-sm text-blue-200 leading-relaxed max-w-xl">
                Track live voting distribution graphs and certified rankings throughout the contest.
                If organizers reopen the portal for special voting rounds, vote tallies update dynamically in real time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Live Leaderboard Graph</span>
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
              >
                <span>Certified Results Archive</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
