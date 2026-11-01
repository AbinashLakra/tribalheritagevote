'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  User,
  MapPin,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
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

const CHUNK_SIZE = 3.5 * 1024 * 1024; // 3.5 MB per chunk (well within all serverless limits)

export function NominationForm({ contestId, categories, onComplete }: NominationFormProps) {
  // Artist Profile Information
  const [fullName, setFullName] = useState('');
  const [stageName, setStageName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Odisha');
  const [district, setDistrict] = useState('Sundargarh');
  const [language, setLanguage] = useState('Sadri');
  const [tribe, setTribe] = useState('Oraon');
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState('');

  // Performance Video Submission Details
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Video File & Upload Progress States
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Success State
  const [submittedData, setSubmittedData] = useState<{
    nominationId: string;
    title: string;
    artistName: string;
    videoUrl?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validate MIME type
    if (!isAllowedVideoType(selectedFile.type)) {
      setError('Invalid video format. Supported formats are MP4, WebM, and MOV.');
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
      setError(`Video file is too large (${formatFileSize(selectedFile.size)}). Maximum limit is ${formatFileSize(MAX_VIDEO_SIZE_BYTES)}.`);
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!fullName.trim() || !stageName.trim()) {
      setError('Please provide your full legal name and stage/troupe name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please provide a valid 10-digit Indian mobile number (+91).');
      return;
    }

    if (!title.trim() || title.trim().length < 5) {
      setError('Performance title must be at least 5 characters long.');
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      setError('Performance description must be at least 20 characters long to explain its cultural significance.');
      return;
    }

    if (!file) {
      setError('Please select an authentic cultural video recording to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Connecting to Cloudflare R2 storage...');

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);

      // ─────────────────────────────────────────────────────────────
      // STEP 1: INITIALIZE MULTIPART UPLOAD ON CLOUDFLARE R2
      // ─────────────────────────────────────────────────────────────
      const initRes = await fetch('/api/uploads/multipart/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
          contestId,
          phone: cleanPhone,
          fullName: fullName.trim(),
          stageName: stageName.trim(),
          state: state.trim(),
          district: district.trim(),
          language: language.trim(),
          tribe: tribe.trim(),
          categoryName: selectedCategory?.name || 'Tribal Performance',
          experienceYears,
          bio: bio.trim(),
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || 'Failed to initialize storage upload session.');
      }

      const { uploadId, objectKey, uploadRecordId, artistProfileId } = initData;

      // ─────────────────────────────────────────────────────────────
      // STEP 2: UPLOAD CHUNKS RESILIENTLY (3.5MB EACH)
      // ─────────────────────────────────────────────────────────────
      const totalBytes = file.size;
      const totalParts = Math.ceil(totalBytes / CHUNK_SIZE);
      const uploadedParts: Array<{ partNumber: number; etag: string }> = [];

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalBytes);
        const chunkBlob = file.slice(start, end, file.type);

        setUploadStatusText(`Uploading video chunk ${partNumber} of ${totalParts}...`);

        const chunkFormData = new FormData();
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('objectKey', objectKey);
        chunkFormData.append('partNumber', partNumber.toString());
        chunkFormData.append('chunk', chunkBlob, file.name);

        const partRes = await fetch('/api/uploads/multipart/part', {
          method: 'POST',
          body: chunkFormData,
        });

        const partData = await partRes.json();
        if (!partRes.ok || !partData.success) {
          throw new Error(partData.error || `Failed to upload chunk ${partNumber} of ${totalParts}.`);
        }

        uploadedParts.push({
          partNumber,
          etag: partData.etag,
        });

        const progressPercent = Math.round((partNumber / totalParts) * 90);
        setUploadProgress(progressPercent);
      }

      // ─────────────────────────────────────────────────────────────
      // STEP 3: FINALIZE MULTIPART UPLOAD ON CLOUDFLARE R2
      // ─────────────────────────────────────────────────────────────
      setUploadStatusText('Verifying video integrity and finalizing storage...');
      const completeRes = await fetch('/api/uploads/multipart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          objectKey,
          uploadRecordId,
          parts: uploadedParts,
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.error || 'Failed to complete video storage upload.');
      }

      setUploadProgress(95);
      setUploadStatusText('Submitting nomination for jury committee review...');

      // ─────────────────────────────────────────────────────────────
      // STEP 4: RECORD OFFICIAL NOMINATION IN DATABASE
      // ─────────────────────────────────────────────────────────────
      const nomRes = await fetch('/api/nominations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId,
          categoryId,
          title: title.trim(),
          description: description.trim(),
          uploadRecordId,
          artistProfileId,
          phone: cleanPhone,
          fullName: fullName.trim(),
          stageName: stageName.trim(),
          state: state.trim(),
          district: district.trim(),
          language: language.trim(),
          tribe: tribe.trim(),
          isDraft: false,
        }),
      });

      const nomData = await nomRes.json();
      if (!nomRes.ok || !nomData.success) {
        throw new Error(nomData.error || 'Failed to register nomination.');
      }

      setUploadProgress(100);
      setUploadStatusText('Nomination successfully submitted!');

      setSubmittedData({
        nominationId: nomData.nominationId,
        title: title.trim(),
        artistName: stageName.trim() || fullName.trim(),
        videoUrl: completeData.publicUrl || previewUrl || undefined,
      });

      onComplete?.();
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'An unexpected error occurred during submission. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // SUCCESS RECEIPT VIEW
  // ─────────────────────────────────────────────────────────────────
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 space-y-6 animate-fade-in">
        <div className="text-center space-y-3 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="inline-block text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-blue-100 text-[#0f2d59]">
            Official Nomination Received
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
            Performance Video Uploaded Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Your performance video has been uploaded directly to Cloudflare R2 storage and submitted for cultural jury evaluation. Once reviewed by the moderation committee, your performance will go live for nationwide public voting.
          </p>
        </div>

        {/* Video Preview Card */}
        {submittedData.videoUrl && (
          <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
            <VideoPlayer src={submittedData.videoUrl} title={submittedData.title} />
          </div>
        )}

        {/* Certificate / Details Summary Box */}
        <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-center border-b border-blue-200/80 pb-2">
            <span className="text-slate-600">Nomination Reference:</span>
            <span className="font-mono font-bold text-blue-900">{submittedData.nominationId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-blue-200/80 pb-2">
            <span className="text-slate-600">Artist / Troupe:</span>
            <span className="font-bold text-slate-900">{submittedData.artistName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-blue-200/80 pb-2">
            <span className="text-slate-600">Performance Title:</span>
            <span className="font-semibold text-slate-900">{submittedData.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Review Status:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider">
              Pending Jury Review
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              setSubmittedData(null);
              setFile(null);
              setPreviewUrl(null);
              setTitle('');
              setDescription('');
            }}
            className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Submit Another Performance</span>
          </button>

          <Link
            href="/artists"
            className="px-6 py-3 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>Explore National Artist Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // NOMINATION SUBMISSION FORM
  // ─────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-md"
    >
      {/* Form Header */}
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0f2d59] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Official Artist Registration &amp; Audition Upload</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
          Adivasi Artist Nomination &amp; Video Submission
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Fill in your cultural profile and upload your authentic performance video directly to Cloudflare R2 storage for national jury evaluation and citizen voting.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ──────────────── SECTION 1: ARTIST CULTURAL IDENTITY ──────────────── */}
      <div className="space-y-5">
        <h3 className="text-sm font-extrabold text-[#0f2d59] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-blue-700" />
          <span>Section 1: Artist &amp; Cultural Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Official Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Birsa Tirkey"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Stage Name / Troupe */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Stage Name / Performing Troupe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. Birsa Folk Performing Troupe"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Indian Mobile Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mobile Number (For Verification &amp; Updates) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-600 flex items-center">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          {/* State */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              State of Origin <span className="text-red-500">*</span>
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Odisha">Odisha</option>
              <option value="Jharkhand">Jharkhand</option>
              <option value="Chhattisgarh">Chhattisgarh</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Bihar">Bihar</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Assam">Assam</option>
              <option value="Other">Other Indian State</option>
            </select>
          </div>

          {/* District */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              District / Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Sundargarh / Rourkela"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Tribe / Community */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Tribe / Indigenous Community <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tribe}
              onChange={(e) => setTribe(e.target.value)}
              placeholder="e.g. Munda, Oraon, Santhal, Ho, Kharia, Gond"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Language / Dialect */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mother Tongue / Dialect
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. Sadri, Kurukh, Mundari, Santali, Odia"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Experience Years */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Years in Folk Art Practice
            </label>
            <input
              type="number"
              min={0}
              max={70}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Artist Cultural Background &amp; Heritage Lineage
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us briefly about your traditional mentors, artistic lineage, or village background."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* ──────────────── SECTION 2: PERFORMANCE SUBMISSION & CLOUDFLARE R2 VIDEO ──────────────── */}
      <div className="space-y-5 pt-2">
        <h3 className="text-sm font-extrabold text-[#0f2d59] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Video className="w-4 h-4 text-blue-700" />
          <span>Section 2: Cultural Performance Video Submission</span>
        </h3>

        {/* Art Category */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Official Award Category <span className="text-red-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Performance Title */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Nominated Title / Song Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tor Boli Re Tor Hansi (Nagpuri Music Video)"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Cultural Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Project Background &amp; Creative Credits <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mention key contributors (Singer, Actor, Director, Choreographer, Cinematographer, Music Director) and cultural highlights of this release."
            required
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Video Upload Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Performance Video Recording (MP4, WebM, MOV — Max 250 MB) <span className="text-red-500">*</span>
          </label>

          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-blue-700 rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-blue-50/40 transition-all group">
              <UploadCloud className="w-12 h-12 text-blue-700 group-hover:scale-110 transition-transform mb-3" />
              <p className="text-sm font-bold text-slate-900">
                Click to browse or drag and drop your cultural performance video
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Horizontal high-definition (1080p / 720p) video recommended
              </p>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                <VideoPlayer src={previewUrl} title="Performance Preview" />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span className="font-medium truncate max-w-xs">
                  {file ? `${file.name} (${formatFileSize(file.size)})` : 'Selected Video'}
                </span>
                <label className="text-blue-700 font-bold cursor-pointer hover:underline">
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

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#0f2d59]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                  <span>{uploadStatusText}</span>
                </span>
                <span className="font-mono text-sm">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-blue-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-800">
                ⚡ Direct Cloudflare R2 chunked upload active. Please do not refresh or close this tab while your video is uploading.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security & Authenticity Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Digital Integrity Protection:</strong> Each submitted video is timestamped, cataloged on Cloudflare R2, and checked against duplicate content to ensure authentic representation of Adivasi heritage.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading}
        className="w-full py-4 px-6 rounded-2xl bg-[#0f2d59] hover:bg-blue-900 disabled:bg-slate-400 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Uploading &amp; Submitting Nomination...</span>
          </>
        ) : (
          <>
            <span>Submit Cultural Nomination Video</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
