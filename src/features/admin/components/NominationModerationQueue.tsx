'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Video, MapPin, Loader2, Sparkles } from 'lucide-react';
import { VideoPlayer } from '@/components/shared/VideoPlayer';

interface NominationItem {
  id: string;
  title: string;
  description: string;
  status: string;
  submitted_at: string | null;
  upload_record: { public_url?: string | null } | null;
  category: { name?: string } | null;
  artist: {
    id: string;
    stage_name: string;
    full_name: string;
    state: string;
    district: string;
    language: string;
    experience_years: number;
    bio: string;
  } | null;
}

interface NominationModerationQueueProps {
  initialNominations: unknown[];
}

export function NominationModerationQueue({ initialNominations }: NominationModerationQueueProps) {
  const router = useRouter();
  const [items, setItems] = useState<NominationItem[]>(initialNominations as NominationItem[]);
  const [activeItem, setActiveItem] = useState<NominationItem | null>(items[0] || null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleModeration = async (action: 'approve' | 'reject' | 'request_correction') => {
    if (!activeItem) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/nominations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId: activeItem.id,
          action,
          reviewerNotes: actionNotes,
          rejectionReason: action === 'reject' ? actionNotes || 'Does not meet cultural criteria' : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply moderation action');
      }

      // Remove from queue
      const nextItems = items.filter((i) => i.id !== activeItem.id);
      setItems(nextItems);
      setActiveItem(nextItems[0] || null);
      setActionNotes('');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-ivory-300 p-16 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-forest-700 mx-auto" />
        <h3 className="text-xl font-bold text-charcoal-900">Moderation Queue Clear</h3>
        <p className="text-sm text-charcoal-600 max-w-md mx-auto">
          All submitted nomination videos have been evaluated by the cultural committee.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Submissions Queue List (1 Col) */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
          Pending Evaluation ({items.length})
        </span>

        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item);
                setErrorMsg(null);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeItem?.id === item.id
                  ? 'bg-forest-50 border-forest-600 shadow-xs ring-1 ring-forest-500'
                  : 'bg-white border-ivory-300 hover:border-forest-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
                <span>{item.category?.name || 'Tribal Art'}</span>
                <span className="capitalize font-semibold text-amber-700">{item.status}</span>
              </div>
              <h4 className="font-bold text-sm text-charcoal-900 line-clamp-1">{item.title}</h4>
              <p className="text-xs text-charcoal-600 line-clamp-1 mt-0.5">
                {item.artist?.stage_name} ({item.artist?.state})
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Review Interface & Video Player (2 Cols) */}
      {activeItem && (
        <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-ivory-300 shadow-xs">
          {errorMsg && (
            <div className="p-3 bg-terracotta-50 border border-terracotta-200 text-terracotta-800 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Video Player */}
          {activeItem.upload_record?.public_url ? (
            <VideoPlayer
              src={activeItem.upload_record.public_url}
              title={activeItem.title}
            />
          ) : (
            <div className="aspect-video bg-charcoal-900 rounded-xl flex items-center justify-center text-ivory-300 text-xs">
              Video media processing or missing
            </div>
          )}

          {/* Performance & Artist Metadata */}
          <div className="space-y-3 border-b border-ivory-200 pb-5">
            <h2 className="text-2xl font-bold text-charcoal-900">{activeItem.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-600">
              <span className="font-semibold text-forest-800">
                Artist: {activeItem.artist?.stage_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {activeItem.artist?.district}, {activeItem.artist?.state}
              </span>
              <span>•</span>
              <span>Language: {activeItem.artist?.language}</span>
              <span>•</span>
              <span>{activeItem.artist?.experience_years} Years Experience</span>
            </div>
            <p className="text-xs text-charcoal-700 leading-relaxed pt-2">
              <strong>Context:</strong> {activeItem.description}
            </p>
          </div>

          {/* Committee Action Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-charcoal-700 mb-1">
                Committee Feedback / Reason (Required for rejection or correction)
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add jury remarks or instructions for the artist..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-ivory-300 focus:border-forest-600 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleModeration('approve')}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve &amp; Publish for Voting
              </button>

              <button
                onClick={() => handleModeration('request_correction')}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Request Corrections
              </button>

              <button
                onClick={() => handleModeration('reject')}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-terracotta-700 hover:bg-terracotta-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

