import { NextRequest, NextResponse } from 'next/server';
import { UploadPartCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2/client';
import { R2_BUCKET_NAME } from '@/config/r2';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Handles multipart video chunk uploads.
 * Bypasses Vercel's 4.5 MB request body limit by accepting 3 MB slices,
 * assembling them into compliant >= 5 MB parts for Cloudflare R2 multipart upload.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadId = formData.get('uploadId') as string;
    const objectKey = formData.get('objectKey') as string;
    const partNumberStr = formData.get('partNumber') as string;
    const sliceIndexStr = (formData.get('sliceIndex') as string) || '0';
    const isLastSlice = formData.get('isLastSlice') === 'true';
    const isLastPart = formData.get('isLastPart') === 'true';
    const chunk = formData.get('chunk') as Blob | null;

    if (!uploadId || !objectKey || !partNumberStr || !chunk) {
      return NextResponse.json(
        { success: false, error: 'uploadId, objectKey, partNumber, and chunk are required.' },
        { status: 400 }
      );
    }

    const partNumber = parseInt(partNumberStr, 10);
    const sliceIndex = parseInt(sliceIndexStr, 10);
    if (isNaN(partNumber) || partNumber < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid part number.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const currentBuffer = Buffer.from(arrayBuffer);
    const s3 = getR2Client();

    // CASE 1: Single-slice final part (S3 allows the last part to be any size < 5GB)
    if (isLastPart && sliceIndex === 0) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: currentBuffer,
      });

      const partResult = await s3.send(uploadPartCommand);
      if (!partResult.ETag) {
        throw new Error('Cloudflare R2 did not return an ETag for this part.');
      }

      return NextResponse.json({
        success: true,
        partNumber,
        etag: partResult.ETag.replace(/"/g, ''),
      });
    }

    const tempSliceKey = `_tmp_parts/${uploadId}/p${partNumber}-0.bin`;

    // CASE 2: Slice 0 of a multi-slice part (store temporarily in R2)
    if (sliceIndex === 0 && !isLastSlice) {
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: tempSliceKey,
        Body: currentBuffer,
      }));

      return NextResponse.json({
        success: true,
        pending: true,
        partNumber,
        sliceIndex,
      });
    }

    // CASE 3: Slice 1 (or concluding slice) — retrieve slice 0, concatenate to >= 5MB, upload Part to R2
    let combinedBuffer = currentBuffer;

    try {
      const getSlice0 = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: tempSliceKey,
      }));

      let slice0Buf: Buffer;
      if (typeof (getSlice0.Body as any)?.transformToByteArray === 'function') {
        const bytes = await (getSlice0.Body as any).transformToByteArray();
        slice0Buf = Buffer.from(bytes);
      } else {
        const chunks: Buffer[] = [];
        for await (const data of getSlice0.Body as any) {
          chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        }
        slice0Buf = Buffer.concat(chunks);
      }

      combinedBuffer = Buffer.concat([slice0Buf, currentBuffer]);
    } catch (err: any) {
      console.warn(`Slice 0 not found on storage (${tempSliceKey}):`, err?.message);
      return NextResponse.json(
        {
          success: false,
          error: `Temporary slice 0 missing or expired: ${err?.message || 'NotFound'}.`,
          needsSlice0Restart: true,
        },
        { status: 400 }
      );
    }

    const uploadPartCommand = new UploadPartCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: combinedBuffer,
    });

    const partResult = await s3.send(uploadPartCommand);

    if (!partResult.ETag) {
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 did not return an ETag for this chunk.' },
        { status: 500 }
      );
    }

    // Clean up temporary slice ONLY after UploadPart succeeds
    s3.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: tempSliceKey,
    })).catch(() => {});

    return NextResponse.json({
      success: true,
      partNumber,
      etag: partResult.ETag.replace(/"/g, ''),
    });
  } catch (error: any) {
    console.error('Upload part error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload video chunk.' },
      { status: 500 }
    );
  }
}
