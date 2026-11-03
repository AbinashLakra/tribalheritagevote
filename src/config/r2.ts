/**
 * @file Cloudflare R2 upload configuration and validation helpers.
 */

// ---------------------------------------------------------------------------
// Size limits
// ---------------------------------------------------------------------------

/** Maximum video file size in bytes (250 MB for high-res iPhone/Android 4K and 1080p uploads). */
export const MAX_VIDEO_SIZE_BYTES: number = 250 * 1024 * 1024;

/** Minimum video duration in seconds (30 seconds). */
export const MIN_VIDEO_DURATION_SECONDS: number = 30;

/** Maximum video duration in seconds (60 seconds / 1 minute). */
export const MAX_VIDEO_DURATION_SECONDS: number = 60;

/** Maximum image file size in bytes (5 MB). */
export const MAX_IMAGE_SIZE_BYTES: number = 5 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Allowed MIME types & extensions
// ---------------------------------------------------------------------------

/** MIME types accepted for video uploads across iOS (iPhone), Android, and Windows. */
export const ALLOWED_VIDEO_MIME_TYPES: readonly string[] = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/3gpp',
  'video/3gpp2',
  'video/ogg',
  'video/x-matroska',
  'video/avi',
  'video/msvideo',
] as const;

/** MIME types accepted for image uploads. */
export const ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** File extensions accepted for video uploads. */
export const ALLOWED_VIDEO_EXTENSIONS: readonly string[] = [
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.3gp',
  '.mkv',
  '.avi',
] as const;

// ---------------------------------------------------------------------------
// Pre-signed URL configuration
// ---------------------------------------------------------------------------

/** Lifetime of a pre-signed upload URL in seconds. */
export const PRESIGNED_URL_EXPIRY_SECONDS: number = 3600;

// ---------------------------------------------------------------------------
// Bucket / domain (sourced from environment)
// ---------------------------------------------------------------------------

/** R2 bucket name (set via environment variable). */
export const R2_BUCKET_NAME: string = process.env.R2_BUCKET_NAME || '';

/** Public media domain served in front of the R2 bucket. */
export const R2_MEDIA_DOMAIN: string =
  process.env.NEXT_PUBLIC_R2_MEDIA_DOMAIN || '';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether the given MIME type or filename is an allowed video type.
 * Supports iOS Safari, Android Chrome, and Desktop file types.
 *
 * @param mimeType - The MIME type string to validate
 * @param filename - Optional original filename to validate by extension
 * @returns `true` if the MIME type or extension is in the allowed video list
 */
export function isAllowedVideoType(mimeType: string, filename?: string): boolean {
  const cleanMime = (mimeType || '').trim().toLowerCase();
  if (cleanMime && (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(cleanMime)) {
    return true;
  }
  if (filename) {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    if ((ALLOWED_VIDEO_EXTENSIONS as readonly string[]).includes(ext)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether the given MIME type is an allowed image type.
 *
 * @param mimeType - The MIME type string to validate
 * @returns `true` if the MIME type is in the allowed image list
 */
export function isAllowedImageType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Validates that a file's size does not exceed the limit for its type.
 *
 * @param size - File size in bytes
 * @param type - Whether the file is a `'video'` or `'image'`
 * @returns `true` if the file size is within the allowed limit
 *
 * @example
 * ```ts
 * isFileSizeValid(1_000_000, 'image'); // true  (1 MB < 5 MB)
 * isFileSizeValid(300_000_000, 'video'); // false (300 MB > 100 MB)
 * ```
 */
export function isFileSizeValid(
  size: number,
  type: 'video' | 'image',
): boolean {
  const limit = type === 'video' ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  return size > 0 && size <= limit;
}

/**
 * Validates whether video duration meets the official 30s to 60s contest rules.
 *
 * @param durationSec - Video duration in seconds
 * @returns `true` if duration is between 30 and 60 seconds
 */
export function isVideoDurationValid(durationSec: number): boolean {
  return durationSec >= MIN_VIDEO_DURATION_SECONDS && durationSec <= MAX_VIDEO_DURATION_SECONDS;
}
