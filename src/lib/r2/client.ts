import { S3Client } from '@aws-sdk/client-s3';

/**
 * Creates an S3-compatible client configured for Cloudflare R2.
 * ⚠️ SERVER ONLY — never import in client components or expose credentials.
 */
let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (r2ClientInstance) {
    return r2ClientInstance;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing Cloudflare R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).'
    );
  }

  r2ClientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2ClientInstance;
}
