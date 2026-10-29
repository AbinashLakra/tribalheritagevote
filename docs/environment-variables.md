# Environment Variable Reference

This document describes all environment variables used by the Tribal Heritage Vote platform.

## Public Variables (Exposed to the Browser)
These variables must be prefixed with `NEXT_PUBLIC_` and are safe for client-side bundle exposure.

| Variable Name | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical platform base URL | `https://tribalheritagevote.in` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project API URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anonymous API key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_R2_MEDIA_DOMAIN` | Optional | Custom Cloudflare CDN domain for video streaming | `https://media.tribalheritagevote.in` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile anti-bot widget site key | `0x4AAAAAA...` |

---

## Secret Variables (Server-Only — NEVER Expose to Browser)
These variables contain privileged credentials and must ONLY be set in `.env.local` or Vercel Environment Variables.

| Variable Name | Required | Security Level | Description |
| :--- | :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **CRITICAL SECRET** | Supabase bypass key for administrative server tasks. |
| `R2_ACCOUNT_ID` | Yes | Secret | Cloudflare Account Identifier. |
| `R2_ACCESS_KEY_ID` | Yes | Secret | S3-compatible Access Key ID for Cloudflare R2. |
| `R2_SECRET_ACCESS_KEY` | Yes | **CRITICAL SECRET** | S3-compatible Secret Access Key for Cloudflare R2. |
| `R2_BUCKET_NAME` | Yes | Configuration | R2 bucket name (e.g. `tribal-heritage-videos`). |
| `TURNSTILE_SECRET_KEY` | Optional | Secret | Server validation secret for Cloudflare Turnstile CAPTCHA. |
| `CRON_SECRET` | Optional | Secret | Authorization token for scheduled cron endpoints. |
| `DEFAULT_TIMEZONE` | Optional | Configuration | Default timezone (`Asia/Kolkata`). |

