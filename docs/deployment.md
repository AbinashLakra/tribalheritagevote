# Production Deployment Guide (Vercel, Supabase & Cloudflare R2)

## 1. Prerequisites
- Node.js `v20+` or `v24+` installed.
- Git repository initialized and pushed to GitHub.
- Supabase Project created (AWS Mumbai `ap-south-1` region recommended).
- Cloudflare R2 Bucket created (`tribal-heritage-videos`).
- Vercel account linked to GitHub.

---

## 2. Step-by-Step Setup

### Step 2.1: Supabase Database Setup
1. Open your Supabase project SQL Editor or install Supabase CLI.
2. Execute the migrations in sequential order from `supabase/migrations/`:
   ```bash
   # Using Supabase CLI:
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```
   Or execute `001_initial_schema.sql` through `010_results_and_analytics.sql` directly in Supabase Dashboard SQL Editor.
3. Apply `supabase/seed.sql` to populate initial categories and contest data.
4. Enable Phone Provider in Supabase Auth:
   - Go to Authentication -> Providers -> Phone.
   - Configure your SMS gateway (Twilio, MessageBird, or custom webhook for Indian DLT).

### Step 2.2: Cloudflare R2 Setup
1. Log in to Cloudflare Dashboard -> R2 Object Storage.
2. Create bucket: `tribal-heritage-videos`.
3. Generate S3-compatible API token with Admin Read/Write permissions on this bucket.
4. Note your Account ID, Access Key ID, and Secret Access Key.
5. In bucket settings, configure CORS policy:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

### Step 2.3: Vercel Deployment
1. Import your GitHub repository into Vercel.
2. Framework Preset: Next.js.
3. Configure Environment Variables in Vercel project settings (copy from `.env.example`).
4. Click **Deploy**.

---

## 3. Post-Deployment Verification
1. Run test suite: `npm test`
2. Run build verification: `npm run build`
3. Verify public homepage, artist directory, and admin dashboard routes.

