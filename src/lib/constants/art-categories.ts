/**
 * @file Competition & Cultural Categories for Tribal Heritage Vote 2026.
 * Official 8 Award Categories for Nagpuri and Regional Tribal Film & Music Awards.
 */

export interface ArtSubcategory {
  readonly id: string;
  readonly name: string;
}

export interface ArtCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly subcategories: readonly ArtSubcategory[];
}

export const ART_CATEGORIES: readonly ArtCategory[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    slug: 'best-music-video-nagpuri',
    name: 'Best Music Video (Nagpuri)',
    description:
      'Honoring the finest visual storytelling, song production, and cultural presentation in Nagpuri music videos.',
    subcategories: [
      { id: 'sub_nagpuri_mv_traditional', name: 'Traditional Nagpuri Music Video' },
      { id: 'sub_nagpuri_mv_modern', name: 'Modern Tribal Fusion Music Video' },
    ],
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    slug: 'best-dance-in-video',
    name: 'Best Dance in Video (Male / Female Leading Role)',
    description:
      'Recognizing outstanding choreography execution, rhythm, and screen presence in lead performance roles.',
    subcategories: [
      { id: 'sub_dance_male', name: 'Lead Dancer (Male)' },
      { id: 'sub_dance_female', name: 'Lead Dancer (Female)' },
      { id: 'sub_dance_duo', name: 'Lead Pair / Duo Dance' },
    ],
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    slug: 'best-actor-leading-role',
    name: 'Best Actor in a Leading Role (Male / Female)',
    description:
      'Celebrating exceptional acting talent, emotional depth, and dramatic expression in leading roles.',
    subcategories: [
      { id: 'sub_actor_male', name: 'Lead Actor (Male)' },
      { id: 'sub_actor_female', name: 'Lead Actor (Female)' },
    ],
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    slug: 'best-singer',
    name: 'Best Singer (Male / Female)',
    description:
      'Honoring outstanding vocal performance, tonality, and melody in regional recorded songs.',
    subcategories: [
      { id: 'sub_singer_male', name: 'Lead Vocalist (Male)' },
      { id: 'sub_singer_female', name: 'Lead Vocalist (Female)' },
      { id: 'sub_duet_vocals', name: 'Duet Vocal Performance' },
    ],
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    slug: 'best-camera-person',
    name: 'Best Cinematographer / Camera Person (Male / Female)',
    description:
      'Recognizing excellence in visual camera framing, lighting composition, drone shots, and video cinematography.',
    subcategories: [
      { id: 'sub_cinematography', name: 'Lead Cinematographer' },
      { id: 'sub_camera_operator', name: 'Camera Operator / Drone Pilot' },
    ],
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    slug: 'best-director',
    name: 'Best Director',
    description:
      'Honoring exceptional creative vision, narrative storytelling, and direction in music videos.',
    subcategories: [
      { id: 'sub_direction_feature', name: 'Music Video Director' },
      { id: 'sub_direction_debut', name: 'Emerging / Debut Director' },
    ],
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    slug: 'best-choreographer',
    name: 'Best Choreographer',
    description:
      'Celebrating original dance composition, rhythm synchronization, and choreography direction.',
    subcategories: [
      { id: 'sub_folk_choreography', name: 'Folk Choreography' },
      { id: 'sub_fusion_choreography', name: 'Fusion & Modern Choreography' },
    ],
  },
  {
    id: 'c8888888-8888-8888-8888-888888888888',
    slug: 'best-music-director',
    name: 'Best Music Director',
    description:
      'Honoring outstanding musical composition, arrangement, background score, and sound design.',
    subcategories: [
      { id: 'sub_music_director_traditional', name: 'Traditional Music Direction' },
      { id: 'sub_music_director_fusion', name: 'Contemporary Music Direction' },
    ],
  },
] as const;

/**
 * Finds an art category by its URL-safe slug.
 */
export function getCategoryBySlug(slug: string): ArtCategory | undefined {
  return ART_CATEGORIES.find((c) => c.slug === slug);
}

export interface AdminPanelConfig {
  readonly id: 1 | 2 | 3 | 4;
  readonly name: string;
  readonly shortName: string;
  readonly categoryIds: readonly string[];
  readonly description: string;
}

export const ADMIN_PANELS: readonly AdminPanelConfig[] = [
  {
    id: 1,
    name: 'Panel 1: Music Video & Lead Dance',
    shortName: 'Panel 1',
    categoryIds: [
      'c1111111-1111-1111-1111-111111111111', // Best Music Video (Nagpuri)
      'c2222222-2222-2222-2222-222222222222', // Best Dance in Video (Male / Female Leading Role)
    ],
    description: 'Reviews and moderates Best Music Video (Nagpuri) and Best Dance in Video.',
  },
  {
    id: 2,
    name: 'Panel 2: Leading Actor & Lead Singer',
    shortName: 'Panel 2',
    categoryIds: [
      'c3333333-3333-3333-3333-333333333333', // Best Actor in a Leading Role (Male / Female)
      'c4444444-4444-4444-4444-444444444444', // Best Singer (Male / Female)
    ],
    description: 'Reviews and moderates Best Actor in a Leading Role and Best Singer.',
  },
  {
    id: 3,
    name: 'Panel 3: Cinematographer & Director',
    shortName: 'Panel 3',
    categoryIds: [
      'c5555555-5555-5555-5555-555555555555', // Best Cinematographer / Camera Person (Male / Female)
      'c6666666-6666-6666-6666-666666666666', // Best Director
    ],
    description: 'Reviews and moderates Best Cinematographer / Camera Person and Best Director.',
  },
  {
    id: 4,
    name: 'Panel 4: Choreographer & Music Director',
    shortName: 'Panel 4',
    categoryIds: [
      'c7777777-7777-7777-7777-777777777777', // Best Choreographer
      'c8888888-8888-8888-8888-888888888888', // Best Music Director
    ],
    description: 'Reviews and moderates Best Choreographer and Best Music Director.',
  },
] as const;

export function getPanelByCategoryId(categoryId: string): AdminPanelConfig | undefined {
  return ADMIN_PANELS.find((p) => p.categoryIds.includes(categoryId));
}

export function getPanelById(panelId: number): AdminPanelConfig | undefined {
  return ADMIN_PANELS.find((p) => p.id === panelId);
}

