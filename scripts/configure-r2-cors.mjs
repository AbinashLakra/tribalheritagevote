import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function configureCors() {
  console.log('Setting CORS policy on R2 bucket:', bucketName);
  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ['*'],
              AllowedMethods: ['GET', 'PUT', 'HEAD', 'POST'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    console.log('✅ CORS policy successfully applied to R2 bucket!');

    const currentCors = await client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    console.log('Current CORS configuration:', JSON.stringify(currentCors.CORSRules, null, 2));
  } catch (err) {
    console.warn('⚠️ Could not configure CORS via API (token may need admin permissions or Cloudflare dashboard):', err.message);
  }
}

configureCors();

