import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME } from '@/config/r2';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Universal media streaming endpoint supporting HTTP 206 Partial Content (Range requests)
 * for seamless video playback across iOS (iPhone Safari), Android Chrome, and Desktop browsers.
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

    const s3 = getR2Client();
    const rangeHeader = req.headers.get('range');

    // Determine MIME type from extension
    const ext = cleanKey.split('.').pop()?.toLowerCase();
    let contentType = 'video/mp4';
    if (ext === 'mov') contentType = 'video/quicktime';
    else if (ext === 'webm') contentType = 'video/webm';
    else if (ext === 'm4v') contentType = 'video/x-m4v';

    // 3. Handle Range Request (Required by iPhone Safari & Chrome for video streaming)
    if (rangeHeader) {
      try {
        const command = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: cleanKey,
          Range: rangeHeader,
        });

        const s3Response = await s3.send(command);
        const webStream = (s3Response.Body as any).transformToWebStream();

        const headers = new Headers();
        headers.set('Content-Type', s3Response.ContentType || contentType);
        headers.set('Accept-Ranges', 'bytes');
        if (s3Response.ContentRange) {
          headers.set('Content-Range', s3Response.ContentRange);
        }
        if (s3Response.ContentLength !== undefined) {
          headers.set('Content-Length', String(s3Response.ContentLength));
        }
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

        return new NextResponse(webStream, {
          status: 206, // Partial Content
          headers,
        });
      } catch (rangeErr: any) {
        console.warn('Range request failed on R2, attempting fallback:', rangeErr?.message);
      }
    }

    // 4. Full Object Fetch (fallback when no Range or Range rejected)
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });
    const head = await s3.send(headCommand);

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });
    const s3Response = await s3.send(command);
    const webStream = (s3Response.Body as any).transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', head.ContentType || s3Response.ContentType || contentType);
    headers.set('Accept-Ranges', 'bytes');
    if (head.ContentLength !== undefined) {
      headers.set('Content-Length', String(head.ContentLength));
    }
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Media stream error:', err);
    return new NextResponse(err?.message || 'Media not found', { status: 404 });
  }
}

/**
 * Handles external URLs: If signed URL has expired or is Supabase storage,
 * redirects or proxies cleanly.
 */
function handleExternalOrLegacyUrl(url: string, req: NextRequest): NextResponse {
  // If it's an R2 URL that contains an object key, try to extract the clean key
  if (url.includes('.r2.cloudflarestorage.com/')) {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/^\/+/, '');
      if (pathname) {
        // Redirect to our universal streaming route with the clean key
        return NextResponse.redirect(new URL(`/api/media/stream?key=${encodeURIComponent(pathname)}`, req.url), 307);
      }
    } catch {
      // ignore parse error
    }
  }

  // Redirect to external URL (e.g. Supabase storage)
  return NextResponse.redirect(url, 307);
}
