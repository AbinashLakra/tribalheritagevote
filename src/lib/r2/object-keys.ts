import { randomUUID } from 'crypto';

/**
 * Generates a deterministic, server-controlled R2 object key for nomination videos.
 * Format: nominations/{contestId}/{artistProfileId}/{uuid}{extension}
 */
export function generateNominationVideoKey(
  contestId: string,
  artistProfileId: string,
  extension: string
): string {
  const uuid = randomUUID();
  const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
  return `nominations/${contestId}/${artistProfileId}/${uuid}${safeExt}`;
}

/**
 * Generates a deterministic key for artist profile avatars/photos.
 * Format: profiles/{userId}/{uuid}{extension}
 */
export function generateProfileImageKey(
  userId: string,
  extension: string
): string {
  const uuid = randomUUID();
  const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
  return `profiles/${userId}/${uuid}${safeExt}`;
}

/**
 * Safely extracts the lowercased file extension from a filename.
 */
export function extractExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}
