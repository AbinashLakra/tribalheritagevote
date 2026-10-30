const token = process.env.VERCEL_TOKEN;
const projectId = 'prj_dhHKyzQ4vw8XJoX56Cd0j2Fz6pJm';

const envVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    type: 'sensitive',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'R2_ACCOUNT_ID',
    value: process.env.R2_ACCOUNT_ID,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'R2_ACCESS_KEY_ID',
    value: process.env.R2_ACCESS_KEY_ID,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'R2_SECRET_ACCESS_KEY',
    value: process.env.R2_SECRET_ACCESS_KEY,
    type: 'sensitive',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'R2_BUCKET_NAME',
    value: process.env.R2_BUCKET_NAME,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'CRON_SECRET',
    value: process.env.CRON_SECRET || 'adivasi_heritage_cron_secret_2026',
    type: 'sensitive',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'DEFAULT_TIMEZONE',
    value: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'https://tribalheritagevote.vercel.app',
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
];

async function syncEnvs() {
  console.log(`Syncing ${envVars.length} environment variables to Vercel project ${projectId}...`);

  for (const env of envVars) {
    if (!env.value) {
      console.warn(`Skipping ${env.key}: value is empty`);
      continue;
    }
    try {
      const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(env),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added ${env.key}`);
      } else {
        console.warn(`⚠️ Warning for ${env.key}:`, data.error?.message || data);
      }
    } catch (err) {
      console.error(`❌ Failed to add ${env.key}:`, err.message);
    }
  }
  console.log('\nAll environment variables synced to Vercel!');
}

syncEnvs();
