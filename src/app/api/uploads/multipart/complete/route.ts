import { NextRequest, NextResponse } from 'next/server';
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME } from '@/config/r2';
import { getMediaUrl } from '@/lib/r2/presigned-download';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uploadId, objectKey, uploadRecordId, parts, directUrl } = body;

    // Handle direct uploaded storage URL (e.g. from direct storage upload)
    if (directUrl && uploadRecordId) {
      const admin = createAdminClient();
      const { error: dbError } = await admin
        .from('upload_records')
        .update({
          upload_status: 'verified',
          public_url: directUrl,
        })
        .eq('id', uploadRecordId);

      if (dbError) {
        console.warn('Failed to update upload_record public_url:', dbError);
      }

      return NextResponse.json({
        success: true,
        message: 'Performance video uploaded and verified successfully!',
        uploadRecordId,
        publicUrl: directUrl,
      });
    }

    if (!uploadId || !objectKey || !uploadRecordId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'uploadId, objectKey, uploadRecordId, and uploaded parts array are required.' },
        { status: 400 }
      );
    }

    // Sort parts by PartNumber in ascending order as required by S3 specification
    const sortedParts = parts
      .map((p: any) => ({
        PartNumber: Number(p.partNumber || p.PartNumber),
        ETag: (p.etag || p.ETag || '').replace(/"/g, ''),
      }))
      .sort((a, b) => a.PartNumber - b.PartNumber)
      .map((p) => ({
        PartNumber: p.PartNumber,
        ETag: `"${p.ETag}"`,
      }));

    const s3 = getR2Client();
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    await s3.send(completeCommand);

    // Generate public/viewing media URL (signed for 7 days / 604800 seconds)
    const publicUrl = await getMediaUrl(objectKey, 604800);

    // Update upload_records in Supabase
    const admin = createAdminClient();
    const { error: dbError } = await admin
      .from('upload_records')
      .update({
        upload_status: 'verified',
        public_url: publicUrl,
      })
      .eq('id', uploadRecordId);

    if (dbError) {
      console.warn('Failed to update upload_record public_url:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Performance video uploaded and verified on Cloudflare R2 successfully!',
      uploadRecordId,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Complete multipart error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to finalize video upload on storage.' },
      { status: 500 }
    );
  }
}

