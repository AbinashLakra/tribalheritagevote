import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME } from '@/config/r2';
import { getMediaUrl } from '@/lib/r2/presigned-download';
import { validateRequestBody } from '@/lib/security/request-validation';

const verifyUploadSchema = z.object({
  uploadRecordId: z.string().uuid('Invalid upload record ID'),
  objectKey: z.string().min(1, 'Object key is required'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in.' },
        { status: 401 }
      );
    }

    const validation = await validateRequestBody(request, verifyUploadSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { uploadRecordId, objectKey } = validation.data;
    const admin = createAdminClient();

    // 1. Verify ownership in database
    const { data: uploadRecord, error: fetchError } = await admin
      .from('upload_records')
      .select('*')
      .eq('id', uploadRecordId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !uploadRecord) {
      return NextResponse.json(
        { success: false, error: 'Upload record not found or unauthorized' },
        { status: 404 }
      );
    }

    // 2. Query R2 via S3 HeadObject to confirm physical presence and actual size
    const s3 = getR2Client();
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    try {
      const headResponse = await s3.send(headCommand);
      const actualSize = headResponse.ContentLength || 0;

      if (actualSize === 0) {
        return NextResponse.json(
          { success: false, error: 'Uploaded object is empty' },
          { status: 400 }
        );
      }

      // 3. Mark upload as verified in database
      const publicUrl = await getMediaUrl(objectKey);

      const { error: updateError } = await admin
        .from('upload_records')
        .update({
          upload_status: 'verified',
          file_size_bytes: actualSize,
          public_url: publicUrl,
        })
        .eq('id', uploadRecordId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update upload status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          uploadRecordId,
          publicUrl,
          verified: true,
        },
      });
    } catch {
      // S3 object not found or error
      await admin
        .from('upload_records')
        .update({ upload_status: 'failed' })
        .eq('id', uploadRecordId);

      return NextResponse.json(
        { success: false, error: 'Media file not found in storage. Upload may have been interrupted.' },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
