/**
 * @file Art categories relevant to Adivasi/tribal art forms.
 * Defines a comprehensive taxonomy of traditional tribal art categories and sub-categories.
 */

/** Represents a sub-category within a main art category. */
export interface ArtSubcategory {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
}

/** Represents a top-level tribal art category. */
export interface ArtCategory {
  /** Unique identifier */
  readonly id: string;
  /** URL-safe slug */
  readonly slug: string;
  /** Human-readable display name */
  readonly name: string;
  /** Brief description of the category */
  readonly description: string;
  /** List of sub-categories within this category */
  readonly subcategories: readonly ArtSubcategory[];
}

/**
 * All art categories relevant to Adivasi/tribal art forms across India.
 */
export const ART_CATEGORIES: readonly ArtCategory[] = [
  {
    id: 'cat_tribal_dance',
    slug: 'tribal-dance',
    name: 'Tribal Dance',
    description:
      'Traditional dance forms passed down through generations across Adivasi communities, celebrating harvest, nature, and community life.',
    subcategories: [
      { id: 'sub_santhali_dance', name: 'Santhali Dance' },
      { id: 'sub_karma_dance', name: 'Karma Dance' },
      { id: 'sub_chhau_dance', name: 'Chhau Dance' },
      { id: 'sub_ho_dance', name: 'Ho Dance' },
      { id: 'sub_bhumij_dance', name: 'Bhumij Dance' },
      { id: 'sub_saora_dance', name: 'Saora Dance' },
    ],
  },
  {
    id: 'cat_folk_music',
    slug: 'folk-music-singing',
    name: 'Folk Music & Singing',
    description:
      'Vocal and instrumental folk music traditions rooted in tribal storytelling, seasonal rituals, and communal gatherings.',
    subcategories: [
      { id: 'sub_santhali_music', name: 'Santhali Music' },
      { id: 'sub_ho_music', name: 'Ho Music' },
      { id: 'sub_gond_music', name: 'Gond Music' },
      { id: 'sub_bhil_music', name: 'Bhil Music' },
    ],
  },
  {
    id: 'cat_traditional_painting',
    slug: 'traditional-painting',
    name: 'Traditional Painting',
    description:
      'Indigenous painting styles using natural pigments and traditional motifs depicting mythology, daily life, and nature.',
    subcategories: [
      { id: 'sub_warli', name: 'Warli Painting' },
      { id: 'sub_sohrai', name: 'Sohrai Painting' },
      { id: 'sub_khovar', name: 'Khovar Painting' },
      { id: 'sub_saura_painting', name: 'Saura Painting' },
      { id: 'sub_gond_painting', name: 'Gond Painting' },
      { id: 'sub_pithora', name: 'Pithora Painting' },
      { id: 'sub_bhil_painting', name: 'Bhil Painting' },
    ],
  },
  {
    id: 'cat_handicrafts_pottery',
    slug: 'handicrafts-pottery',
    name: 'Handicrafts & Pottery',
    description:
      'Hand-made crafts, metal work, pottery, and bamboo artistry using age-old techniques preserved within tribal communities.',
    subcategories: [
      { id: 'sub_dokra', name: 'Dokra Metal Craft' },
      { id: 'sub_dhokra', name: 'Dhokra Casting' },
      { id: 'sub_terracotta', name: 'Terracotta' },
      { id: 'sub_bamboo_craft', name: 'Bamboo Craft' },
    ],
  },
  {
    id: 'cat_tribal_instruments',
    slug: 'tribal-instruments',
    name: 'Tribal Instruments',
    description:
      'Traditional musical instruments crafted and played by tribal artisans for ceremonial and cultural performances.',
    subcategories: [
      { id: 'sub_mandar', name: 'Mandar' },
      { id: 'sub_tumdak', name: 'Tumdak' },
      { id: 'sub_tamak', name: 'Tamak' },
      { id: 'sub_bansuri', name: 'Bansuri' },
    ],
  },
  {
    id: 'cat_performing_arts',
    slug: 'performing-arts',
    name: 'Performing Arts',
    description:
      'Live performance traditions including street theatre, oral storytelling, and puppet shows that preserve tribal narratives.',
    subcategories: [
      { id: 'sub_street_theatre', name: 'Street Theatre' },
      { id: 'sub_storytelling', name: 'Storytelling' },
      { id: 'sub_puppet_show', name: 'Puppet Show' },
    ],
  },
] as const;

/**
 * Finds an art category by its URL-safe slug.
 *
 * @param slug - The slug to look up (e.g. `"tribal-dance"`)
 * @returns The matching {@link ArtCategory}, or `undefined` if not found
 *
 * @example
 * ```ts
 * const cat = getCategoryBySlug('warli-painting'); // undefined — slug is per category
 * const cat = getCategoryBySlug('traditional-painting'); // ArtCategory
 * ```
 */
export function getCategoryBySlug(slug: string): ArtCategory | undefined {
  return ART_CATEGORIES.find((c) => c.slug === slug);
}
