import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from './client';
import {
  R2_BUCKET_NAME,
  PRESIGNED_URL_EXPIRY_SECONDS,
  isAllowedVideoType,
  isAllowedImageType,
  isFileSizeValid,
} from '@/config/r2';

export interface PresignedUploadOptions {
  objectKey: string;
  contentType: string;
  fileSizeBytes: number;
  mediaType: 'video' | 'image';
}

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresAt: Date;
}

/**
 * Generates a short-lived presigned URL for direct browser-to-R2 upload.
 * Strictly validates MIME type and file size before issuing the presigned URL.
 */
export async function generatePresignedUploadUrl({
  objectKey,
  contentType,
  fileSizeBytes,
  mediaType,
}: PresignedUploadOptions): Promise<PresignedUploadResult> {
  // 1. Validate MIME type
  if (mediaType === 'video' && !isAllowedVideoType(contentType)) {
    throw new Error(`Invalid video MIME type: ${contentType}`);
  }
  if (mediaType === 'image' && !isAllowedImageType(contentType)) {
    throw new Error(`Invalid image MIME type: ${contentType}`);
  }

  // 2. Validate file size
  if (!isFileSizeValid(fileSizeBytes, mediaType)) {
    throw new Error(`File size ${fileSizeBytes} bytes exceeds allowed limit for ${mediaType}`);
  }

  const client = getR2Client();
  const bucket = R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME environment variable is not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });

  const expiresAt = new Date(Date.now() + PRESIGNED_URL_EXPIRY_SECONDS * 1000);

  return {
    uploadUrl,
    objectKey,
    expiresAt,
  };
}
