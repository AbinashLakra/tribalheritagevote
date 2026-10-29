import fs from 'fs';
import path from 'path';

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'fktyysodewyjlqowonvx';
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

async function executeSql(sql, label) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Failed to apply ${label}: ${res.status} ${text}`);
  }
  console.log(`✓ ${label} applied successfully`);
}

async function run() {
  const migrationsDir = path.resolve('supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    await executeSql(sql, file);
  }

  // Apply seed.sql
  const seedPath = path.resolve('supabase/seed.sql');
  if (fs.existsSync(seedPath)) {
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await executeSql(seedSql, 'seed.sql');
  }

  console.log('🎉 All 10 migrations and seed data deployed to Supabase successfully!');
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
