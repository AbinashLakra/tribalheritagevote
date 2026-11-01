import { NextRequest, NextResponse } from 'next/server';
import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME } from '@/config/r2';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadId = formData.get('uploadId') as string;
    const objectKey = formData.get('objectKey') as string;
    const partNumberStr = formData.get('partNumber') as string;
    const chunk = formData.get('chunk') as Blob | null;

    if (!uploadId || !objectKey || !partNumberStr || !chunk) {
      return NextResponse.json(
        { success: false, error: 'uploadId, objectKey, partNumber, and chunk are required.' },
        { status: 400 }
      );
    }

    const partNumber = parseInt(partNumberStr, 10);
    if (isNaN(partNumber) || partNumber < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid part number.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const s3 = getR2Client();
    const uploadPartCommand = new UploadPartCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
    });

    const partResult = await s3.send(uploadPartCommand);

    if (!partResult.ETag) {
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 did not return an ETag for this chunk.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partNumber,
      etag: partResult.ETag,
    });
  } catch (error: any) {
    console.error('Upload part error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload video chunk.' },
      { status: 500 }
    );
  }
}

