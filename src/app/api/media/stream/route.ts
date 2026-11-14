import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME, R2_MEDIA_DOMAIN } from '@/config/r2';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Universal media streaming endpoint:
 * Redirects directly to Cloudflare R2 / CDN for high-speed, zero-origin-bandwidth playback
 * with full HTTP 206 Range request support for iPhone Safari, Android, and PC.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get('key');
    const id = searchParams.get('id');

    // 1. Resolve object key from DB record ID if needed
    if (!key && id) {
      const admin = createAdminClient();
      const { data: rec } = await admin
        .from('upload_records')
        .select('object_key, public_url')
        .eq('id', id)
        .maybeSingle();

      if (rec?.object_key) {
        key = rec.object_key;
      } else if (rec?.public_url) {
        return handleExternalOrLegacyUrl(rec.public_url, req);
      }
    }

    if (!key) {
      return new NextResponse('Media key or record ID is required', { status: 400 });
    }

    // 2. Decode and sanitize key
    let cleanKey = decodeURIComponent(key).trim().replace(/^\/+/, '');

    // Check if key is a full external URL (e.g. Supabase or signed R2 URL)
    if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
      return handleExternalOrLegacyUrl(cleanKey, req);
    }

    // 3. ZERO VERCEL BANDWIDTH: Always redirect directly to Cloudflare R2 public CDN
    const cdnBase = (R2_MEDIA_DOMAIN || 'https://pub-24b13a9fc1b244bca16f253538b62c9f.r2.dev').replace(/\/+$/, '');
    const cdnUrl = `${cdnBase}/${cleanKey}`;
    
    const res = NextResponse.redirect(cdnUrl, 307);
    res.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    );
    return res;
  } catch (err: any) {
    console.error('Media stream error:', err);
    // Even in error handler, redirect directly to Cloudflare R2 fallback instead of proxying bytes
    const fallbackBase = 'https://pub-24b13a9fc1b244bca16f253538b62c9f.r2.dev';
    const fallbackKey = req.nextUrl.searchParams.get('key') || '';
    if (fallbackKey) {
      return NextResponse.redirect(`${fallbackBase}/${encodeURIComponent(fallbackKey.replace(/^\/+/, ''))}`, 307);
    }
    return new NextResponse(err?.message || 'Media not found', { status: 404 });
  }
}

/**
 * Handles external URLs: If signed URL has expired or is Supabase storage,
 * redirects cleanly.
 */
function handleExternalOrLegacyUrl(url: string, req: NextRequest): NextResponse {
  // If it's an R2 URL that contains an object key, try to extract the clean key
  if (url.includes('.r2.cloudflarestorage.com/')) {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/^\/+/, '');
      if (pathname) {
        return NextResponse.redirect(new URL(`/api/media/stream?key=${encodeURIComponent(pathname)}`, req.url), 307);
      }
    } catch {
      // ignore parse error
    }
  }

  // Redirect to external URL (e.g. Supabase storage)
  return NextResponse.redirect(url, 307);
}

