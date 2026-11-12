import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, MapPin, ArrowRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCategoryBySlug, ART_CATEGORIES } from '@/lib/constants/art-categories';
import { enhanceNominationsWithBoost, extractContestSettings } from '@/lib/voting/vote-display-calculator';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category' };
  }

  return {
    title: `${category.name} — Adivasi Cultural Arts`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: contest } = await admin
    .from('contests')
    .select('id, title, status, settings, leaderboard_visibility, voting_start_at, voting_end_at, reopening_reason')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const contestSettings = extractContestSettings(contest);

  // Query approved nominations in this category
  const { data: rawNominations } = await admin
    .from('nominations')
    .select(`
      id,
      title,
      vote_count,
      category:contest_categories(name, slug),
      artist:artist_profiles(id, stage_name, state, district)
    `)
    .eq('status', 'approved')
    .order('vote_count', { ascending: false });

  const boostedNominations = enhanceNominationsWithBoost(rawNominations || [], contest);
  boostedNominations.sort((a, b) => b.vote_count - a.vote_count);
  const nominations = boostedNominations;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-600 hover:text-forest-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Homepage
        </Link>
      </div>

      <div className="bg-forest-900 text-white rounded-3xl p-8 md:p-12 space-y-4 tribal-pattern-bg">
        <span className="text-xs uppercase font-bold tracking-widest text-terracotta-400">
          Cultural Category
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{category.name}</h1>
        <p className="text-ivory-200 text-base md:text-lg max-w-2xl leading-relaxed">
          {category.description}
        </p>

        {category.subcategories && category.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {category.subcategories.map((sub) => (
              <span
                key={sub.id}
                className="px-3 py-1 rounded-full bg-forest-800/80 border border-forest-600/50 text-xs font-semibold text-ivory-100"
              >
                {sub.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nominations in this category */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-charcoal-900">
          Approved Nominations in {category.name}
        </h2>

        {nominations && nominations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nominations.map((nom) => {
              const artist = nom.artist as {
                id?: string;
                stage_name?: string;
                state?: string;
                district?: string;
              } | null;

              return (
                <div
                  key={nom.id}
                  className="bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-video bg-charcoal-900 flex items-center justify-center text-ivory-300">
                      <Video className="w-10 h-10 opacity-70" />
                    </div>
                    <div className="p-5 space-y-1.5">
                      <h3 className="font-bold text-base text-charcoal-900 line-clamp-1">
                        {artist?.stage_name || 'Traditional Artist'}
                      </h3>
                      <p className="text-xs text-charcoal-600 line-clamp-2">
                        &ldquo;{nom.title}&rdquo;
                      </p>
                      <p className="text-xs text-forest-700 font-semibold pt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {artist?.state}, {artist?.district}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-charcoal-600">
                        {contestSettings.show_public_votes ? `${nom.vote_count} Votes` : 'Official Nomination'}
                      </span>
                      <Link
                        href={`/artists/${artist?.id || nom.id}`}
                        className="px-4 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        Watch &amp; Vote
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-ivory-300 space-y-3">
            <p className="text-charcoal-600">No approved nominations currently in this category.</p>
            <Link
              href="/artists"
              className="inline-block px-5 py-2 bg-forest-700 text-white rounded-lg text-sm font-semibold hover:bg-forest-800 transition-colors"
            >
              Browse All Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
