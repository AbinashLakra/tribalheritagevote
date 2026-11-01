'use client';

import React, { useState, useMemo } from 'react';
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
  Mail,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Clock,
  Camera,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { isAllowedVideoType } from '@/config/r2';
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

const CHUNK_SIZE = 3.5 * 1024 * 1024; // 3.5 MB per chunk

// Official Criteria Constraints
const MIN_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB
const MIN_DURATION_SEC = 30;
const MAX_DURATION_SEC = 40;
const MIN_WORDS = 300;
const MAX_WORDS = 500;

export function NominationForm({ contestId, categories, onComplete }: NominationFormProps) {
  // Artist Profile Information
  const [fullName, setFullName] = useState('');
  const [stageName, setStageName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Odisha');
  const [district, setDistrict] = useState('Sundargarh');
  const [language, setLanguage] = useState('Nagpuri / Sadri');
  const [tribe, setTribe] = useState('Oraon');
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState('');

  // Artist Avatar / Photo
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Phone Verification via SMS OTP
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Performance Video Submission Details
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Video File & Criteria Validation States
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
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

  // Live Word Count
  const wordCount = useMemo(() => {
    if (!description.trim()) return 0;
    return description.trim().split(/\s+/).filter(Boolean).length;
  }, [description]);

  // Handle Avatar Selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError('Profile photo must be less than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  // Dispatch OTP
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number first.');
      return;
    }

    setSendingOtp(true);
    setError(null);
    setOtpNotice(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setOtpSent(true);
      if (data.codePreview) {
        setOtpNotice(`Verification OTP generated for +91 ${cleanPhone}. Code: ${data.codePreview} (Valid for 5 min).`);
      } else {
        setOtpNotice(`SMS verification OTP dispatched to +91 ${cleanPhone}. Please enter the 6-digit code received.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error sending OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired OTP code.');
      }

      setIsPhoneVerified(true);
      setOtpNotice('Mobile number verified successfully! You will remain verified for the contest duration.');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Video File Selection & Strict Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setDetectedDuration(null);

    // 1. MIME check
    if (!isAllowedVideoType(selectedFile.type)) {
      setError('Invalid video format. Supported formats are MP4, WebM, and MOV.');
      return;
    }

    // 2. Strict Size check (15 MB to 20 MB)
    const sizeBytes = selectedFile.size;
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeBytes < MIN_VIDEO_BYTES || sizeBytes > MAX_VIDEO_BYTES) {
      setError(
        `Video size must be strictly between 15 MB and 20 MB. Your selected file is ${sizeMB.toFixed(2)} MB.`
      );
      return;
    }

    // 3. Strict Duration check (30s to 40s) via HTML5 Video metadata
    const objectUrl = URL.createObjectURL(selectedFile);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      const dur = Math.round(tempVideo.duration);
      setDetectedDuration(dur);

      if (dur < MIN_DURATION_SEC || dur > MAX_DURATION_SEC) {
        setError(
          `Video time length must be between 30 seconds and 40 seconds. Detected duration is ${dur} seconds.`
        );
      }
    };

    setFile(selectedFile);
    setPreviewUrl(objectUrl);
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Profile Validations
    if (!fullName.trim() || !stageName.trim()) {
      setError('Please provide your full legal name and stage/troupe name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please provide a valid 10-digit Indian mobile number (+91).');
      return;
    }

    if (!isPhoneVerified) {
      setError('Please verify your mobile number via OTP before submitting your nomination.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    // Word Count Validation (300 to 500 words)
    if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) {
      setError(
        `Performance description must be strictly between 300 and 500 words (Current word count: ${wordCount}).`
      );
      return;
    }

    // Video Criteria
    if (!file) {
      setError('Please select an authentic cultural video recording to upload.');
      return;
    }

    if (file.size < MIN_VIDEO_BYTES || file.size > MAX_VIDEO_BYTES) {
      setError(
        `Video size must be between 15 MB and 20 MB (Current: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
      );
      return;
    }

    if (detectedDuration && (detectedDuration < MIN_DURATION_SEC || detectedDuration > MAX_DURATION_SEC)) {
      setError(
        `Video duration must be between 30 and 40 seconds (Detected: ${detectedDuration}s).`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Connecting to Cloudflare R2 storage...');

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);

      // STEP 1: INITIALIZE MULTIPART UPLOAD ON CLOUDFLARE R2
      const initRes = await fetch('/api/uploads/multipart/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
          contestId,
          phone: cleanPhone,
          email: email.trim(),
          fullName: fullName.trim(),
          stageName: stageName.trim(),
          state: state.trim(),
          district: district.trim(),
          language: language.trim(),
          tribe: tribe.trim(),
          categoryName: selectedCategory?.name || 'Tribal Performance',
          experienceYears,
          bio: bio.trim(),
          avatarUrl: avatarPreview || null,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || 'Failed to initialize storage upload session.');
      }

      const { uploadId, objectKey, uploadRecordId, artistProfileId } = initData;

      // STEP 2: UPLOAD CHUNKS RESILIENTLY (3.5MB SLICES)
      const totalBytes = file.size;
      const totalParts = Math.ceil(totalBytes / CHUNK_SIZE);
      const uploadedParts: Array<{ partNumber: number; etag: string }> = [];

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalBytes);
        const chunkBlob = file.slice(start, end, file.type);

        setUploadStatusText(`Uploading video chunk ${partNumber} of ${totalParts} to Cloudflare R2...`);

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

      // STEP 3: FINALIZE MULTIPART UPLOAD ON CLOUDFLARE R2
      setUploadStatusText('Verifying video checksum and finalizing Cloudflare storage...');
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

      // STEP 4: RECORD OFFICIAL NOMINATION IN DATABASE
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
          email: email.trim(),
          fullName: fullName.trim(),
          stageName: stageName.trim(),
          state: state.trim(),
          district: district.trim(),
          language: language.trim(),
          tribe: tribe.trim(),
          avatarUrl: avatarPreview || null,
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

  // SUCCESS VIEW
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 space-y-6 animate-fade-in">
        <div className="text-center space-y-3 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 block">
            Verification Docket Confirmed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Nomination Submitted for Jury Review!
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your cultural performance video and verified profile have been routed to the assigned Admin Verification Desk.
          </p>
        </div>

        {submittedData.videoUrl && (
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-300 aspect-video bg-black shadow-md">
            <VideoPlayer src={submittedData.videoUrl} title={submittedData.title} />
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 max-w-lg mx-auto space-y-2">
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="text-slate-500">Nomination ID:</span>
            <span className="font-mono font-bold text-slate-900">{submittedData.nominationId}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="text-slate-500">Performance Title:</span>
            <span className="font-bold text-slate-900">{submittedData.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Verified Artist:</span>
            <span className="font-bold text-slate-900">{submittedData.artistName}</span>
          </div>
        </div>

        <div className="text-center pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/artists"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0f2d59] text-white font-bold text-xs uppercase tracking-wider shadow hover:bg-blue-900 transition-all text-center"
          >
            Explore Public Directory
          </Link>
          <Link
            href="/vote"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow hover:bg-amber-400 transition-all text-center"
          >
            Cast 8-Category Vote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
      {/* Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Validation Issue:</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: ARTIST IDENTITY & SMS VERIFICATION */}
      <div className="space-y-5 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0f2d59] flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              1. Artist Profile &amp; Mobile Verification
            </h3>
            <p className="text-xs text-slate-500">
              Provide legal name, address, and verify mobile number via OTP. You remain verified until event results.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Photo Avatar Upload */}
          <div className="sm:col-span-2 flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg overflow-hidden shrink-0 border-2 border-amber-400 shadow-sm">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-900" />
              )}
            </div>
            <div className="space-y-1 flex-1">
              <label className="block text-xs font-bold text-slate-800">
                Artist Photo / Troupe Avatar
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-[#0f2d59] hover:file:bg-blue-200 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">JPG, PNG, or WebP up to 5 MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rameshwar Oraon"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Stage Name / Troupe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. Karma Mandali Rourkela"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artist@example.com"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Phone + SMS OTP Verification Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Mobile Number (+91) <span className="text-red-500">*</span>
              </label>
              {isPhoneVerified && (
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                required
                disabled={isPhoneVerified}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
              {!isPhoneVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>

          {/* OTP Input Row */}
          {!isPhoneVerified && otpSent && (
            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
              <p className="text-xs text-amber-900 font-semibold">{otpNotice}</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-40 p-2 text-center tracking-widest text-sm font-bold bg-white rounded-xl border border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify Mobile OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Address Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Odisha, Jharkhand, etc."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Sundargarh, Ranchi, etc."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CATEGORY & CULTURAL DESCRIPTION */}
      <div className="space-y-5 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              2. Award Category &amp; Video Description (300-500 Words)
            </h3>
            <p className="text-xs text-slate-500">
              Select one of the 8 award categories and write a detailed cultural background description (300-500 words).
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Competition Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Performance Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mahua Phool Nagpuri Song Video"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Description with Live Word Count Counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Cultural Performance Description (300 to 500 words) <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  wordCount >= MIN_WORDS && wordCount <= MAX_WORDS
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {wordCount} / {MIN_WORDS}-{MAX_WORDS} words
              </span>
            </div>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the musical composition, cultural folklore, instruments utilized (Mandar, Dhol, Nagara), costumes, lyrical theme, and performance tradition (Between 300 and 500 words)..."
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CLOUDFLARE R2 VIDEO UPLOAD WITH STRICT LIMITS */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              3. Video Upload Criteria (30-40s • 15-20 MB)
            </h3>
            <p className="text-xs text-slate-500">
              Uploaded directly to Cloudflare R2 server. Strict criteria: 30-40 sec duration and 15-20 MB file size.
            </p>
          </div>
        </div>

        {/* Video Upload Box */}
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-6 sm:p-8 text-center transition-colors bg-slate-50/50">
          <input
            type="file"
            id="video-upload"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="video-upload" className="cursor-pointer space-y-3 block">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#0f2d59] flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-800">
                Click here to browse your video file
              </p>
              <p className="text-xs text-slate-500">
                Format: MP4, WebM, MOV • Size: 15 MB - 20 MB • Length: 30s - 40s
              </p>
            </div>

            {file && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block text-left text-xs space-y-1">
                <p className="font-bold text-slate-900 truncate max-w-xs">{file.name}</p>
                <div className="flex items-center gap-3 text-slate-500">
                  <span>Size: {formatFileSize(file.size)}</span>
                  {detectedDuration && <span>Duration: {detectedDuration}s</span>}
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-blue-900">
              <span>{uploadStatusText}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-blue-200 overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Preview Player */}
        {previewUrl && !isUploading && (
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-300 aspect-video bg-black shadow-inner">
            <VideoPlayer src={previewUrl} title="Local Preview" />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-4 px-6 rounded-2xl bg-[#0f2d59] hover:bg-blue-900 text-white font-extrabold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading to Cloudflare R2...</span>
            </>
          ) : (
            <>
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span>Submit Nomination File Request to Admin</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
