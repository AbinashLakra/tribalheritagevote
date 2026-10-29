import { S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

console.log('Testing Cloudflare R2 connection...');
console.log('Account ID:', accountId);
console.log('Bucket Name:', bucketName);
console.log('Endpoint:', `https://${accountId}.r2.cloudflarestorage.com`);

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function testR2() {
  try {
    // 1. Check if bucket exists
    console.log('1. Checking bucket head...');
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log('✅ Bucket exists and is accessible!');

    // 2. Test write object
    console.log('2. Testing PutObject probe...');
    const testKey = 'healthcheck/ping.txt';
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'Tribal Heritage Vote R2 connection test: OK',
        ContentType: 'text/plain',
      })
    );
    console.log('✅ PutObject succeeded: uploaded healthcheck/ping.txt');

    // 3. Test list objects
    console.log('3. Testing ListObjectsV2...');
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 5,
      })
    );
    console.log(`✅ ListObjectsV2 succeeded. Found ${listRes.KeyCount || 0} object(s).`);

    // 4. Clean up probe
    await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: testKey }));
    console.log('✅ DeleteObject succeeded: cleaned up healthcheck/ping.txt');

    console.log('\n🎉 ALL CLOUDFLARE R2 CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Cloudflare R2 test failed:', err);
    process.exit(1);
  }
}

testR2();
