'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Video, FileText } from 'lucide-react';
import { nominationSchema, NominationInput } from '../schemas';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { MAX_VIDEO_SIZE_BYTES, isAllowedVideoType } from '@/config/r2';
import { formatFileSize } from '@/lib/utils/formatters';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface NominationFormProps {
  contestId: string;
  categories: CategoryOption[];
  onComplete?: () => void;
}

export function NominationForm({ contestId, categories, onComplete }: NominationFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadRecordId, setUploadRecordId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NominationInput>({
    resolver: zodResolver(nominationSchema),
    defaultValues: {
      contestId,
      categoryId: categories[0]?.id || '',
      title: '',
      description: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploadError(null);

    // Validate MIME type
    if (!isAllowedVideoType(selectedFile.type)) {
      setUploadError('Invalid video format. Only MP4, WebM, and MOV are supported.');
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
      setUploadError(`File is too large. Maximum size allowed is ${formatFileSize(MAX_VIDEO_SIZE_BYTES)}.`);
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setUploadRecordId(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const uploadVideoDirectlyToR2 = async (): Promise<string | null> => {
    if (!file) {
      setUploadError('Please select a nomination performance video.');
      return null;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Request presigned URL from Next.js server
      const presignedRes = await fetch('/api/uploads/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
          mediaType: 'video',
          contestId,
        }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedRes.ok || !presignedData.success) {
        throw new Error(presignedData.error || 'Failed to acquire upload authorization');
      }

      const { uploadUrl, objectKey, uploadRecordId: recId } = presignedData.data;

      // 2. Direct upload to Cloudflare R2 with progress tracking via XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Direct storage upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during video upload'));
        xhr.send(file);
      });

      // 3. Confirm and verify upload with server
      const verifyRes = await fetch('/api/uploads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadRecordId: recId,
          objectKey,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Storage verification failed');
      }

      setUploadRecordId(recId);
      if (verifyData.data.publicUrl) {
        setPreviewUrl(verifyData.data.publicUrl);
      }
      return recId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: NominationInput, isDraft = false) => {
    setUploadError(null);
    setSubmitSuccess(null);

    let activeRecId = uploadRecordId;
    if (!activeRecId) {
      activeRecId = await uploadVideoDirectlyToR2();
      if (!activeRecId) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/nominations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          uploadRecordId: activeRecId,
          isDraft,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to submit nomination');
      }

      setSubmitSuccess(resData.message);
      onComplete?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setUploadError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, false))}
      className="space-y-8 bg-white p-6 md:p-10 rounded-2xl border border-ivory-300 shadow-sm"
    >
      <div className="border-b border-ivory-200 pb-5">
        <h2 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-forest-700" />
          Nomination Submission
        </h2>
        <p className="text-sm text-charcoal-600 mt-1">
          Upload your authentic performance video and provide background details for the cultural evaluation panel.
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-forest-50 border border-forest-200 rounded-xl text-forest-800 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{submitSuccess}</p>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-terracotta-50 border border-terracotta-200 rounded-xl text-terracotta-800 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{uploadError}</p>
        </div>
      )}

      {/* Video Upload Area */}
      <div>
        <label className="block text-sm font-semibold text-charcoal-800 mb-2">
          Performance Video (MP4, WebM, MOV — Max 250MB) <span className="text-terracotta-600">*</span>
        </label>

        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-ivory-300 hover:border-forest-600 rounded-2xl cursor-pointer bg-ivory-50/50 hover:bg-forest-50/30 transition-all group">
            <UploadCloud className="w-12 h-12 text-forest-600 group-hover:scale-110 transition-transform mb-3" />
            <p className="text-sm font-semibold text-charcoal-800">
              Click to browse or drag and drop your video file
            </p>
            <p className="text-xs text-charcoal-500 mt-1">
              High definition horizontal recording recommended (1080p / 720p)
            </p>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            <VideoPlayer src={previewUrl} title="Nomination Video Preview" />
            <div className="flex items-center justify-between text-xs text-charcoal-600">
              <span>{file ? `${file.name} (${formatFileSize(file.size)})` : 'Selected Video'}</span>
              <label className="text-forest-700 font-semibold cursor-pointer hover:underline">
                Replace Video
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-charcoal-700">
              <span>Uploading directly to secure storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Nomination Category */}
      <div>
        <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
          Art Category <span className="text-terracotta-600">*</span>
        </label>
        <select
          {...register('categoryId')}
          className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none bg-white text-charcoal-900"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-xs text-terracotta-600 mt-1">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Performance Title */}
      <div>
        <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
          Performance / Art Title <span className="text-terracotta-600">*</span>
        </label>
        <input
          {...register('title')}
          placeholder="e.g. Santhali Spring Harvest Dance (Baha Parab)"
          className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
        />
        {errors.title && (
          <p className="text-xs text-terracotta-600 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Performance Description */}
      <div>
        <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
          Description & Cultural Context <span className="text-terracotta-600">*</span>
        </label>
        <p className="text-xs text-charcoal-500 mb-2">
          Explain the traditional meaning of this performance, tribal instruments used, occasion, and lyrics summary.
        </p>
        <textarea
          {...register('description')}
          rows={5}
          placeholder="Explain the cultural significance of the performance..."
          className="w-full px-4 py-3 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
        />
        {errors.description && (
          <p className="text-xs text-terracotta-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-ivory-200">
        <button
          type="submit"
          disabled={isUploading || isSubmitting}
          className="w-full sm:w-auto px-8 py-3 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Submission...
            </>
          ) : (
            'Submit for Committee Review'
          )}
        </button>

        <button
          type="button"
          onClick={handleSubmit((data) => onSubmit(data, true))}
          disabled={isUploading || isSubmitting}
          className="w-full sm:w-auto px-6 py-3 border border-ivory-400 hover:bg-ivory-100 text-charcoal-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Save as Draft
        </button>
      </div>
    </form>
  );
}

