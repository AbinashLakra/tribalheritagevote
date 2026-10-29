'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { PhoneVerificationModal } from '@/features/auth/components/PhoneVerificationModal';
import { VoteConfirmationDialog } from './VoteConfirmationDialog';

interface VoteButtonProps {
  contestId: string;
  nominationId: string;
  artistName: string;
  nominationTitle: string;
  category: string;
  initialHasVoted?: boolean;
}

export function VoteButton({
  contestId,
  nominationId,
  artistName,
  nominationTitle,
  category,
  initialHasVoted = false,
}: VoteButtonProps) {
  const router = useRouter();
  const [hasVoted, setHasVoted] = useState<boolean>(initialHasVoted);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Check voter's status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/voting/status?contestId=${contestId}`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.hasVoted) {
            setHasVoted(true);
          }
        }
      } catch {
        // Silent fallback to initial state
      } finally {
        setIsCheckingStatus(false);
      }
    }
    checkStatus();
  }, [contestId]);

  const handleVoteClick = async () => {
    setVoteError(null);
    try {
      // Check auth status
      const res = await fetch(`/api/voting/status?contestId=${contestId}`);
      const data = await res.json();

      if (!data.success || !data.data.isAuthenticated || !data.data.isVerified) {
        setShowPhoneModal(true);
        return;
      }

      if (data.data.hasVoted) {
        setHasVoted(true);
        setVoteError('You have already cast your vote in this contest.');
        return;
      }

      setShowConfirmModal(true);
    } catch {
      setShowPhoneModal(true);
    }
  };

  const handlePhoneVerificationSuccess = () => {
    setShowPhoneModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    setIsSubmittingVote(true);
    setVoteError(null);

    try {
      const res = await fetch('/api/voting/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId,
          nominationId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setHasVoted(true);
      setShowConfirmModal(false);

      const voteId = data.data?.vote_id;
      if (voteId) {
        router.push(`/vote/receipt/${voteId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voting failed';
      setVoteError(msg);
      setShowConfirmModal(false);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="h-12 w-48 bg-ivory-200 animate-pulse rounded-xl" />
    );
  }

  if (hasVoted) {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-100 border border-forest-300 text-forest-800 font-semibold text-sm shadow-xs">
        <CheckCircle2 className="w-5 h-5 text-forest-700" />
        <span>Vote Recorded in this Contest</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleVoteClick}
        className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-terracotta-600 hover:bg-terracotta-700 active:scale-98 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-terracotta-200"
      >
        <Heart className="w-5 h-5 fill-current" />
        <span>Vote for this Artist</span>
      </button>

      {voteError && (
        <div className="flex items-center gap-1.5 text-xs text-terracotta-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{voteError}</span>
        </div>
      )}

      {/* Step 1: Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={handlePhoneVerificationSuccess}
        title="Verify Phone to Vote"
        description={`To vote for ${artistName}, please verify your mobile number. Each citizen may cast strictly one vote.`}
      />

      {/* Step 2: Explicit Confirmation Dialog */}
      <VoteConfirmationDialog
        isOpen={showConfirmModal}
        artistName={artistName}
        nominationTitle={nominationTitle}
        category={category}
        isSubmitting={isSubmittingVote}
        onConfirm={handleConfirmVote}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}

