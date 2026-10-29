import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePresignedUploadUrl } from '@/lib/r2/presigned-upload';
import { generateNominationVideoKey, generateProfileImageKey, extractExtension } from '@/lib/r2/object-keys';
import { validateRequestBody } from '@/lib/security/request-validation';

const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  fileSizeBytes: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  mediaType: z.enum(['video', 'image']),
  contestId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to upload files.' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const validation = await validateRequestBody(request, presignedUrlRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { filename, fileSizeBytes, mimeType, mediaType, contestId } = validation.data;
    const extension = extractExtension(filename);

    if (!extension) {
      return NextResponse.json(
        { success: false, error: 'File must have a valid extension' },
        { status: 400 }
      );
    }

    // 3. Fetch artist profile for videos
    let objectKey: string;
    const admin = createAdminClient();

    if (mediaType === 'video') {
      if (!contestId) {
        return NextResponse.json(
          { success: false, error: 'Contest ID is required for video nominations' },
          { status: 400 }
        );
      }

      const { data: artistProfile, error: profileError } = await admin
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !artistProfile) {
        return NextResponse.json(
          { success: false, error: 'Artist profile not found. Please complete your profile first.' },
          { status: 404 }
        );
      }

      objectKey = generateNominationVideoKey(contestId, artistProfile.id, extension);
    } else {
      objectKey = generateProfileImageKey(user.id, extension);
    }

    // 4. Generate short-lived presigned upload URL
    const { uploadUrl, expiresAt } = await generatePresignedUploadUrl({
      objectKey,
      contentType: mimeType,
      fileSizeBytes,
      mediaType,
    });

    // 5. Pre-register upload record with 'pending' status
    const { data: uploadRecord, error: dbError } = await admin
      .from('upload_records')
      .insert({
        user_id: user.id,
        object_key: objectKey,
        original_filename: filename,
        file_size_bytes: fileSizeBytes,
        mime_type: mimeType,
        upload_status: 'pending',
      })
      .select('id')
      .single();

    if (dbError || !uploadRecord) {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize upload tracking record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        objectKey,
        uploadRecordId: uploadRecord.id,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload initialization failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
