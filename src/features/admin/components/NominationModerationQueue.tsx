'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Video,
  MapPin,
  Loader2,
  Sparkles,
  Trash2,
  Phone,
  Mail,
  User,
  Clock,
  Filter,
  Search,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { ADMIN_PANELS } from '@/lib/constants/art-categories';

interface NominationItem {
  id: string;
  title: string;
  description: string;
  status: string;
  category_id?: string;
  rejection_count?: number;
  is_disqualified?: boolean;
  reviewer_notes?: string | null;
  rejection_reason?: string | null;
  submitted_at: string | null;
  upload_record: { public_url?: string | null } | null;
  category: { id?: string; name?: string; slug?: string } | null;
  artist: {
    id: string;
    stage_name: string;
    full_name: string;
    state: string;
    district: string;
    language: string;
    experience_years: number;
    bio: string;
    avatar_url?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

interface NominationModerationQueueProps {
  initialNominations: unknown[];
  sessionRole: 'super_admin' | 'co_admin' | 'panel_admin' | 'sub_admin';
  assignedPanel?: number;
}

export function NominationModerationQueue({
  initialNominations,
  sessionRole,
  assignedPanel = 1,
}: NominationModerationQueueProps) {
  const router = useRouter();
  const [items, setItems] = useState<NominationItem[]>(initialNominations as NominationItem[]);
  const [activeItemId, setActiveItemId] = useState<string | null>(items[0]?.id || null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for Super Admin / Co-Admin
  const [panelFilter, setPanelFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active item
  const activeItem = useMemo(() => {
    return items.find((i) => i.id === activeItemId) || items[0] || null;
  }, [items, activeItemId]);

  // Word count helper for description
  const descriptionWordCount = useMemo(() => {
    if (!activeItem?.description) return 0;
    return activeItem.description.trim().split(/\s+/).filter(Boolean).length;
  }, [activeItem?.description]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Panel filter
      if (panelFilter !== 'all') {
        const panelConfig = ADMIN_PANELS.find((p) => p.id === panelFilter);
        if (panelConfig && item.category_id && !panelConfig.categoryIds.includes(item.category_id)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'pending') {
        if (!['submitted', 'under_review', 'correction_required'].includes(item.status)) return false;
      } else if (statusFilter === 'approved') {
        if (item.status !== 'approved') return false;
      } else if (statusFilter === 'rejected') {
        if (item.status !== 'rejected') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchArtist = item.artist?.stage_name?.toLowerCase().includes(q) || item.artist?.full_name?.toLowerCase().includes(q);
        const matchCategory = item.category?.name?.toLowerCase().includes(q);
        return matchTitle || matchArtist || matchCategory;
      }

      return true;
    });
  }, [items, panelFilter, statusFilter, searchQuery]);

  const handleModeration = async (action: 'approve' | 'reject' | 'request_correction' | 'unapprove') => {
    if (!activeItem) return;

    const trimmedNotes = actionNotes.trim();

    if ((action === 'reject' || action === 'request_correction') && !trimmedNotes) {
      setErrorMsg('Please specify the rejection or correction feedback reason so the artist can see what to correct.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: {
        nominationId: string;
        action: 'approve' | 'reject' | 'request_correction' | 'unapprove';
        reviewerNotes?: string;
        rejectionReason?: string;
      } = {
        nominationId: activeItem.id,
        action,
      };

      if (trimmedNotes) {
        payload.reviewerNotes = trimmedNotes;
      }

      if (action === 'reject' || action === 'request_correction') {
        payload.rejectionReason = trimmedNotes;
      }

      const res = await fetch('/api/nominations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply moderation action.');
      }

      setSuccessMsg(data.message || 'Action saved successfully.');

      // Update state locally
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItem.id
            ? {
                ...i,
                status: data.data.status,
                rejection_count: data.data.rejection_count,
                is_disqualified: data.data.is_disqualified,
                rejection_reason: action === 'approve' ? null : (trimmedNotes || i.rejection_reason),
              }
            : i
        )
      );

      setActionNotes('');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Super Admin Permanent Deletion
  const handleDeletePermanent = async (nominationId: string, artistName: string) => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE nomination "${activeItem?.title}" by "${artistName}" from the database? This will completely purge the nomination and all related votes.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/nominations/review?nominationId=${nominationId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete record.');
      }

      setSuccessMsg(`Nomination for ${artistName} permanently deleted from database.`);
      setItems((prev) => prev.filter((i) => i.id !== nominationId));
      setActiveItemId(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete nomination.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Toolbar (Visible for Super Admin / Co-Admin) */}
      {(sessionRole === 'super_admin' || sessionRole === 'co_admin') && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Panels:
            </span>
            <button
              onClick={() => setPanelFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                panelFilter === 'all'
                  ? 'bg-[#0f2d59] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All 8 Categories
            </button>
            {ADMIN_PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPanelFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  panelFilter === p.id
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Panel {p.id}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artist or title..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      )}

      {/* Queue View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Submissions Queue List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Submissions ({filteredItems.length})
            </span>
            <div className="flex gap-1 text-[11px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-0.5 rounded ${statusFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-slate-500'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2 py-0.5 rounded ${statusFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
              >
                Approved
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No submissions found matching filter.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === activeItem?.id;
                const strikes = item.rejection_count || 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveItemId(item.id);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-[#0f2d59] shadow-md ring-2 ring-blue-600/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block truncate">
                          {item.category?.name || 'Category'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {item.artist?.stage_name || item.artist?.full_name}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                            item.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : item.status === 'rejected'
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>

                        {strikes > 0 && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              item.is_disqualified
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            Strike {strikes}/3
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {item.artist?.district}, {item.artist?.state}
                      </span>
                      <span>
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Evaluation Workspace (2 Cols) */}
        <div className="lg:col-span-2">
          {activeItem ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Header Title & Disqualification Alert */}
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#0f2d59] text-xs font-bold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    <span>{activeItem.category?.name || 'Nomination Category'}</span>
                  </span>

                  {/* Strike Counter Badge */}
                  <div className="flex items-center gap-2">
                    {activeItem.is_disqualified ? (
                      <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>DISQUALIFIED (3/3 Strikes Reached)</span>
                      </span>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          (activeItem.rejection_count || 0) > 0
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Evaluation Strikes: {activeItem.rejection_count || 0} / 3 Max
                      </span>
                    )}

                    {sessionRole === 'super_admin' && (
                      <button
                        onClick={() =>
                          handleDeletePermanent(
                            activeItem.id,
                            activeItem.artist?.stage_name || 'Artist'
                          )
                        }
                        disabled={isProcessing}
                        title="Permanently delete nomination and artist data from database"
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeItem.title}
                </h2>
              </div>

              {/* Artist Profile Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs overflow-hidden">
                      {activeItem.artist?.avatar_url ? (
                        <img
                          src={activeItem.artist.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        activeItem.artist?.stage_name?.charAt(0) || 'A'
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {activeItem.artist?.stage_name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Legal Name: {activeItem.artist?.full_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-600">
                    <span className="font-semibold block">
                      {activeItem.artist?.district}, {activeItem.artist?.state}
                    </span>
                    <span className="text-slate-500">
                      Language: {activeItem.artist?.language || 'Nagpuri / Regional'}
                    </span>
                  </div>
                </div>

                {/* Contact row for verification checks */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  {activeItem.artist?.phone && (
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      +91 {activeItem.artist.phone}
                    </span>
                  )}
                  {activeItem.artist?.email && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {activeItem.artist.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Video Player */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>Cloudflare R2 Performance Video Recording</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Rule Criteria: 30-40s duration • 15-20MB size
                  </span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-300 bg-black aspect-video shadow-inner">
                  {activeItem.upload_record?.public_url ? (
                    <VideoPlayer
                      src={activeItem.upload_record.public_url}
                      title={activeItem.title}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      Video file link not found or processing
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Description with Word Count Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Performance Cultural Description
                  </label>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      descriptionWordCount >= 5
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {descriptionWordCount} words (Min 5 words)
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                  {activeItem.description}
                </div>
              </div>

              {/* Previous Rejection Reason Display if any */}
              {activeItem.rejection_reason && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Previous Jury Rejection Feedback (Visible to Artist):
                  </p>
                  <p>{activeItem.rejection_reason}</p>
                </div>
              )}

              {/* Moderation Actions Desk */}
              {!activeItem.is_disqualified && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">
                    Jury Committee Feedback &amp; Decision Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Enter review notes or specific reasons if requesting correction or rejecting criteria..."
                    className="w-full p-3 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* If NOT approved, show Approve Button */}
                    {activeItem.status !== 'approved' && (
                      <button
                        onClick={() => handleModeration('approve')}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Approve Nomination (Live for Voting)</span>
                      </button>
                    )}

                    {/* If ALREADY approved, show Unapprove Button */}
                    {activeItem.status === 'approved' && (
                      <button
                        onClick={() => handleModeration('unapprove')}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span>Unapprove (Remove from Public Voting)</span>
                      </button>
                    )}

                    {/* Reject with Feedback / 3-Strikes */}
                    {activeItem.status !== 'rejected' && (
                      <button
                        onClick={() => handleModeration('request_correction')}
                        disabled={isProcessing}
                        className="py-3 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Reject / Request Correction ({activeItem.rejection_count || 0}/3)</span>
                      </button>
                    )}

                    {/* Prominent Super Admin Delete from Database Button */}
                    {sessionRole === 'super_admin' && (
                      <button
                        onClick={() =>
                          handleDeletePermanent(
                            activeItem.id,
                            activeItem.artist?.stage_name || activeItem.artist?.full_name || 'Artist'
                          )
                        }
                        disabled={isProcessing}
                        className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete From Database</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-500">
              Select a nomination from the list to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
