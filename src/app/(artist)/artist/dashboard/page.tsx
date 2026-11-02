import Link from 'next/link';
import { Video, User, CheckCircle2, Clock, AlertTriangle, ArrowRight, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Artist Dashboard',
  description: 'Manage your Adivasi artist profile and contest nominations.',
};

export default async function ArtistDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in in production, render sign-in prompt
  const isLoggedIn = !!user;
  let artistProfile = null;
  let nomination = null;

  if (isLoggedIn) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    artistProfile = profile;

    if (artistProfile) {
      const { data: nom } = await admin
        .from('nominations')
        .select('*, contest:contests(title, status), category:contest_categories(name)')
        .eq('artist_profile_id', artistProfile.id)
        .maybeSingle();
      nomination = nom;
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-900 text-white rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700/60 text-ivory-200 text-xs font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-terracotta-400" />
            National Cultural Showcase
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {artistProfile?.stage_name ? `Welcome, ${artistProfile.stage_name}` : 'Adivasi Artists Portal'}
          </h1>
          <p className="text-ivory-200 text-sm md:text-base leading-relaxed">
            Submit your cultural performance videos, track review status by the jury committee, and connect with millions of citizens celebrating tribal heritage.
          </p>
        </div>
      </div>

      {/* Profile & Nomination Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Artist Profile */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal-900">Artist Profile</h2>
              <p className="text-sm text-charcoal-600 mt-1">
                {artistProfile
                  ? `${artistProfile.state}, ${artistProfile.district} • ${artistProfile.primary_category}`
                  : 'You have not created your persistent artist profile yet.'}
              </p>
            </div>
            {artistProfile && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-forest-100 text-forest-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Profile Active
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-ivory-200">
            <Link
              href="/artist/profile"
              className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-forest-800 transition-colors"
            >
              {artistProfile ? 'Edit Profile Information' : 'Create Artist Profile'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 2: Contest Nomination */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal-900">Contest Nomination</h2>
              <p className="text-sm text-charcoal-600 mt-1">
                {nomination
                  ? `${nomination.title} (${nomination.category?.name || 'Nomination'})`
                  : 'Submit your entry for the Dharti Abba Veer Birsa Munda Cultural & Film Awards.'}
              </p>
            </div>

            {nomination ? (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    nomination.status === 'approved'
                      ? 'bg-forest-100 text-forest-800'
                      : nomination.status === 'rejected'
                      ? 'bg-terracotta-100 text-terracotta-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {nomination.status === 'approved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : nomination.status === 'rejected' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  Status: {nomination.status.replace('_', ' ').toUpperCase()}
                </span>
                {nomination.status === 'approved' && (
                  <span className="text-xs font-semibold text-charcoal-700">
                    Votes Received: {nomination.vote_count}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="pt-6 mt-6 border-t border-ivory-200">
            <Link
              href={nomination ? '/artist/nomination/status' : '/artist/nomination'}
              className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors"
            >
              {nomination ? 'View Submission & Jury Notes' : 'Submit New Nomination'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
