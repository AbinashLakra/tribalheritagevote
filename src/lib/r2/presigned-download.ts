import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from './client';
import { R2_BUCKET_NAME, R2_MEDIA_DOMAIN } from '@/config/r2';

/**
 * Returns the public playback/viewing URL for an object stored in R2.
 * If a custom CDN domain (NEXT_PUBLIC_R2_MEDIA_DOMAIN) is configured, uses it.
 * Otherwise, generates a secure, signed URL valid for the specified expiry.
 */
export async function getMediaUrl(
  objectKey: string,
  expiresInSeconds: number = 7200
): Promise<string> {
  if (R2_MEDIA_DOMAIN) {
    const cleanDomain = R2_MEDIA_DOMAIN.replace(/\/+$/, '');
    const cleanKey = objectKey.replace(/^\/+/, '');
    return `${cleanDomain}/${cleanKey}`;
  }

  const client = getR2Client();
  const bucket = R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  return getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}
