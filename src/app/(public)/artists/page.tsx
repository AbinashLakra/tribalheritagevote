import Link from 'next/link';
import { Search, MapPin, Sparkles, Filter, Video, ArrowRight, User } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { INDIAN_STATES } from '@/lib/constants/states';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Approved Adivasi Artists Directory',
  description: 'Explore jury-approved nominations, discover indigenous folk art forms, and vote for your chosen candidate.',
};

interface ArtistsDirectoryPageProps {
  searchParams: Promise<{
    search?: string;
    state?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ArtistsDirectoryPage({ searchParams }: ArtistsDirectoryPageProps) {
  const { search = '', state = '', category = '', page = '1' } = await searchParams;
  const admin = createAdminClient();

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 12;
  const offset = (currentPage - 1) * pageSize;

  // Build query
  let query = admin
    .from('nominations')
    .select(`
      id,
      title,
      description,
      vote_count,
      upload_record:upload_records(public_url),
      category:contest_categories(name, slug),
      artist:artist_profiles(id, stage_name, full_name, state, district, primary_category)
    `, { count: 'exact' })
    .eq('status', 'approved');

  if (state) {
    query = query.eq('artist.state', state);
  }

  const { data: nominations, count } = await query
    .order('vote_count', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / pageSize);

  // Filter nominations by category or search on server/memory if needed
  let filteredNominations = nominations || [];

  if (search) {
    const s = search.toLowerCase();
    filteredNominations = filteredNominations.filter((n) => {
      const stageName = (n.artist as { stage_name?: string })?.stage_name?.toLowerCase() || '';
      const title = n.title?.toLowerCase() || '';
      return stageName.includes(s) || title.includes(s);
    });
  }

  if (category) {
    filteredNominations = filteredNominations.filter((n) => {
      const catSlug = (n.category as { slug?: string })?.slug;
      return catSlug === category;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-ivory-300 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Official Directory
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Adivasi Artists &amp; Performers
        </h1>
        <p className="text-sm md:text-base text-charcoal-600 max-w-2xl">
          Browse verified nominations approved by the cultural jury. Every verified citizen may cast one official vote.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs space-y-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by artist or title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-sm text-charcoal-900"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              name="state"
              defaultValue={state}
              className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-sm text-charcoal-900 bg-white"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              name="category"
              defaultValue={category}
              className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-sm text-charcoal-900 bg-white"
            >
              <option value="">All Art Categories</option>
              {ART_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Filter Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Artists Grid */}
      {filteredNominations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNominations.map((nom) => {
            const artist = nom.artist as {
              id?: string;
              stage_name?: string;
              state?: string;
              district?: string;
              primary_category?: string;
            } | null;

            const cat = nom.category as { name?: string; slug?: string } | null;
            const artistId = artist?.id || nom.id;

            return (
              <div
                key={nom.id}
                className="bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video bg-charcoal-900 relative flex items-center justify-center text-ivory-300">
                    <Video className="w-10 h-10 opacity-70" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-semibold text-white">
                      {cat?.name || 'Tribal Art'}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-charcoal-900 line-clamp-1">
                      {artist?.stage_name || 'Traditional Artist'}
                    </h3>
                    <p className="text-xs text-charcoal-600 font-medium line-clamp-2">
                      &ldquo;{nom.title}&rdquo;
                    </p>
                    <p className="text-xs text-forest-700 font-semibold flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {artist?.state}, {artist?.district}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal-600">
                      {nom.vote_count} Votes
                    </span>
                    <Link
                      href={`/artists/${artistId}`}
                      className="px-4 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>View &amp; Vote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-2xl border border-ivory-300 space-y-4">
          <User className="w-12 h-12 text-forest-700 mx-auto" />
          <h3 className="text-xl font-bold text-charcoal-900">No Artists Found</h3>
          <p className="text-sm text-charcoal-600 max-w-md mx-auto">
            Try adjusting your search criteria or state filter to view approved nominations.
          </p>
          <Link
            href="/artists"
            className="inline-block px-5 py-2 border border-ivory-400 text-charcoal-700 text-sm font-semibold rounded-lg hover:bg-ivory-100"
          >
            Clear Filters
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/artists?page=${p}&state=${encodeURIComponent(state)}&category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                p === currentPage
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-ivory-300 text-charcoal-700 hover:bg-ivory-100'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
