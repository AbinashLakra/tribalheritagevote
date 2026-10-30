import { NextRequest, NextResponse } from 'next/server';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME, isAllowedVideoType, isFileSizeValid } from '@/config/r2';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractExtension } from '@/lib/r2/object-keys';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      filename,
      fileSizeBytes,
      mimeType,
      contestId,
      phone,
      fullName,
      stageName,
      state,
      district,
      language,
      tribe,
      categoryName,
      experienceYears = 3,
      bio = '',
    } = body;

    // 1. Basic Validations
    if (!filename || !fileSizeBytes || !mimeType) {
      return NextResponse.json(
        { success: false, error: 'File metadata (filename, size, MIME type) is required.' },
        { status: 400 }
      );
    }

    if (!isAllowedVideoType(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid video format. Supported formats are MP4, WebM, and MOV.' },
        { status: 400 }
      );
    }

    if (!isFileSizeValid(fileSizeBytes, 'video')) {
      return NextResponse.json(
        { success: false, error: 'Video size exceeds the maximum allowed limit of 250 MB.' },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Valid 10-digit Indian mobile number is required.' },
        { status: 400 }
      );
    }

    const extension = extractExtension(filename) || 'mp4';
    const admin = createAdminClient();

    // 2. Provision / Retrieve User Identity
    const email = `artist.${cleanPhone}@tribalheritage.org`;
    let userId: string;

    // Check if auth user already exists with this email or phone
    const { data: userList } = await admin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(
      (u) => u.email === email || u.phone === `+91${cleanPhone}`
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || 'Adivasi Artist',
          phone: cleanPhone,
          state: state || 'Odisha',
          district: district || 'Sundargarh',
        },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { success: false, error: 'Failed to provision artist account: ' + createError?.message },
          { status: 500 }
        );
      }
      userId = newUser.user.id;
    }

    // 3. Ensure `profiles` record exists
    await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: fullName || 'Adivasi Artist',
          phone: cleanPhone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    // 4. Ensure `artist_profiles` record exists
    const { data: artistProfile, error: profileError } = await admin
      .from('artist_profiles')
      .upsert(
        {
          user_id: userId,
          full_name: fullName || 'Adivasi Artist',
          stage_name: stageName || fullName || 'Adivasi Performer',
          bio: bio || `Traditional Adivasi artist from ${district || 'Sundargarh'}, ${state || 'Odisha'}. Community: ${tribe || 'Indigenous'}.`,
          state: state || 'Odisha',
          district: district || 'Sundargarh',
          language: language || 'Sadri',
          primary_category: categoryName || 'Tribal & Folk Performing Arts',
          experience_years: Number(experienceYears) || 3,
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single();

    if (profileError || !artistProfile) {
      return NextResponse.json(
        { success: false, error: 'Failed to record artist profile: ' + profileError?.message },
        { status: 500 }
      );
    }

    // 5. Initialize S3 / Cloudflare R2 Multipart Upload
    const s3 = getR2Client();
    const cleanContestId = contestId || 'a1111111-1111-1111-1111-111111111111';
    const timestamp = Date.now();
    const objectKey = `nominations/${cleanContestId}/${artistProfile.id}/${timestamp}.${extension}`;

    const initCommand = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
    });

    const initResult = await s3.send(initCommand);
    const uploadId = initResult.UploadId;

    if (!uploadId) {
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 failed to initialize multipart upload session.' },
        { status: 500 }
      );
    }

    // 6. Record upload record in database
    const { data: uploadRecord, error: uploadDbError } = await admin
      .from('upload_records')
      .insert({
        user_id: userId,
        object_key: objectKey,
        original_filename: filename,
        file_size_bytes: fileSizeBytes,
        mime_type: mimeType,
        upload_status: 'pending',
      })
      .select('id')
      .single();

    if (uploadDbError || !uploadRecord) {
      return NextResponse.json(
        { success: false, error: 'Failed to record upload track: ' + uploadDbError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadId,
      objectKey,
      uploadRecordId: uploadRecord.id,
      artistProfileId: artistProfile.id,
    });
  } catch (error: any) {
    console.error('Multipart init error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error initializing video upload.' },
      { status: 500 }
    );
  }
}
