'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  Sparkles,
  Award,
  MapPin,
  Clock,
  Heart,
  Check,
  Lock,
  Smartphone,
  X,
  User,
  Users,
} from 'lucide-react';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { PhoneVerificationModal } from '@/features/auth/components/PhoneVerificationModal';
import { createClient } from '@/lib/supabase/browser';
import { isGenderedCategory } from '@/lib/constants/art-categories';

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface ArtistNomination {
  id: string;
  category_id: string;
  sub_category?: 'male' | 'female' | 'general';
  title: string;
  description: string;
  vote_count: number;
  upload_record?: { public_url?: string } | null;
  artist?: {
    id: string;
    stage_name: string;
    full_name: string;
    state: string;
    district: string;
    avatar_url?: string | null;
  } | null;
}

interface BallotVoteRecord {
  id: string;
  category_id: string;
  sub_category?: string;
  nomination_id: string;
  server_timestamp: string;
  nomination?: { title?: string } | null;
  artist?: { stage_name?: string; state?: string; district?: string } | null;
}

function VotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCategorySlug = searchParams.get('category');
  const requestedArtistId = searchParams.get('artist');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ballot Data
  const [contest, setContest] = useState<{ id: string; title: string; status: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [voterPhone, setVoterPhone] = useState<string | null>(null);
  const [voterEmail, setVoterEmail] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominationsByCategory, setNominationsByCategory] = useState<Record<string, ArtistNomination[]>>({});
  const [votedCategoryIds, setVotedCategoryIds] = useState<string[]>([]);
  const [votedTrackKeys, setVotedTrackKeys] = useState<string[]>([]);
  const [votedNominationIds, setVotedNominationIds] = useState<string[]>([]);
  const [ballotVotes, setBallotVotes] = useState<BallotVoteRecord[]>([]);

  // Navigation & Selection State
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [activeGenderFilter, setActiveGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedNominationId, setSelectedNominationId] = useState<string>('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSuccessNotice, setVoteSuccessNotice] = useState<string | null>(null);

  // Modal Dialogs
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Success Confirmation Popup (After casting a vote)
  const [justVotedInfo, setJustVotedInfo] = useState<{
    artistName: string;
    categoryName: string;
    totalVoted: number;
    subCategory?: string;
    canVoteOtherTrack?: boolean;
    otherTrackName?: string;
  } | null>(null);

  // Fetch full ballot state from API
  const fetchBallot = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/voting/ballot');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load official voting ballot.');
      }

      const bData = data.data;
      setContest(bData.contest);
      setIsAuthenticated(bData.isAuthenticated);
      setIsVerified(bData.isVerified);
      setVoterPhone(bData.voterPhone);
      setVoterEmail(bData.voterEmail || null);
      setCategories(bData.categories || []);
      setNominationsByCategory(bData.nominationsByCategory || {});
      setVotedCategoryIds(bData.votedCategoryIds || []);
      const tracks = bData.votedTrackKeys || [];
      setVotedTrackKeys(tracks);
      setVotedNominationIds(bData.votedNominationIds || []);
      setBallotVotes(bData.ballotVotes || []);

      // If voter is not verified, prompt them with verification modal
      if (!bData.isVerified) {
        setShowPhoneModal(true);
      }

      // Determine unvoted categories considering 12 tracks
      const unvotedCats = (bData.categories || []).filter((c: Category) => {
        if (isGenderedCategory(c.id)) {
          const maleVoted = tracks.includes(`${c.id}_male`);
          const femaleVoted = tracks.includes(`${c.id}_female`);
          return !maleVoted || !femaleVoted;
        }
        return !tracks.includes(`${c.id}_general`) && !bData.votedCategoryIds?.includes(c.id);
      });

      // If user came via query param
      if (requestedCategorySlug) {
        const found = (bData.categories || []).find((c: Category) => c.slug === requestedCategorySlug);
        if (found) {
          setActiveCategoryId(found.id);
          if (requestedArtistId) setSelectedNominationId(requestedArtistId);
          return;
        }
      }

      // If requested by artist ID directly
      if (requestedArtistId && bData.nominationsByCategory) {
        for (const catId of Object.keys(bData.nominationsByCategory)) {
          const matchingNom = bData.nominationsByCategory[catId].find(
            (n: ArtistNomination) => n.id === requestedArtistId
          );
          if (matchingNom) {
            setActiveCategoryId(catId);
            setSelectedNominationId(requestedArtistId);
            return;
          }
        }
      }

      // Default to first unvoted category, or first category
      if (unvotedCats.length > 0) {
        setActiveCategoryId(unvotedCats[0].id);
      } else if (bData.categories?.length > 0) {
        setActiveCategoryId(bData.categories[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to voting service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBallot();
  }, [requestedCategorySlug, requestedArtistId]);

  // Active Category & Current Nominations
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) || categories[0] || null;
  }, [categories, activeCategoryId]);

  const activeNominations = useMemo(() => {
    if (!activeCategory) return [];
    return nominationsByCategory[activeCategory.id] || [];
  }, [nominationsByCategory, activeCategory]);

  const isCurrentGendered = useMemo(() => {
    return activeCategory ? isGenderedCategory(activeCategory.id) : false;
  }, [activeCategory]);

  const isMaleTrackVoted = useMemo(() => {
    if (!activeCategory) return false;
    return votedTrackKeys.includes(`${activeCategory.id}_male`);
  }, [activeCategory, votedTrackKeys]);

  const isFemaleTrackVoted = useMemo(() => {
    if (!activeCategory) return false;
    return votedTrackKeys.includes(`${activeCategory.id}_female`);
  }, [activeCategory, votedTrackKeys]);

  const isCurrentCategoryFullyVoted = useMemo(() => {
    if (!activeCategory) return false;
    if (isCurrentGendered) {
      return isMaleTrackVoted && isFemaleTrackVoted;
    }
    return votedTrackKeys.includes(`${activeCategory.id}_general`) || votedCategoryIds.includes(activeCategory.id);
  }, [activeCategory, isCurrentGendered, isMaleTrackVoted, isFemaleTrackVoted, votedTrackKeys, votedCategoryIds]);

  const filteredNominations = useMemo(() => {
    if (!isCurrentGendered || activeGenderFilter === 'all') {
      return activeNominations;
    }
    return activeNominations.filter((n) => (n.sub_category || 'male') === activeGenderFilter);
  }, [activeNominations, isCurrentGendered, activeGenderFilter]);

  const allBallotCompleted = useMemo(() => {
    return votedTrackKeys.length >= 12;
  }, [votedTrackKeys]);

  // Handle Logout (Available at any time!)
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setIsVerified(false);
    setVoterPhone(null);
    setVoterEmail(null);
    setVotedCategoryIds([]);
    setVotedTrackKeys([]);
    setVotedNominationIds([]);
    setBallotVotes([]);
    setJustVotedInfo(null);
    setIsLoggingOut(false);
    router.replace('/');
  };

  // Submit Vote for the Active Category and Track
  const handleCastCategoryVote = async () => {
    if (!activeCategory || !selectedNominationId) {
      setError('Please select an artist nominee in this category to cast your vote.');
      return;
    }

    if (!isVerified) {
      setShowPhoneModal(true);
      return;
    }

    const selectedNom = activeNominations.find((n) => n.id === selectedNominationId);
    if (!selectedNom) {
      setError('Selected nominee could not be verified.');
      return;
    }

    // Check if voter already voted for this artist
    if (votedNominationIds.includes(selectedNominationId)) {
      setError('You have already voted for this artist. Duplicate votes for the same artist are not permitted.');
      return;
    }

    // Check track key
    const nomTrack = isCurrentGendered ? (selectedNom.sub_category || 'general') : 'general';
    const targetTrackKey = `${activeCategory.id}_${nomTrack}`;

    if (votedTrackKeys.includes(targetTrackKey)) {
      const trackName = nomTrack === 'male' ? 'Male Track' : nomTrack === 'female' ? 'Female Track' : 'Category';
      setError(`You have already cast your vote for the ${trackName} in this award category.`);
      return;
    }

    setIsSubmittingVote(true);
    setError(null);
    setVoteSuccessNotice(null);

    try {
      const res = await fetch('/api/voting/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId: contest?.id || 'a1111111-1111-1111-1111-111111111111',
          nominationId: selectedNominationId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record vote for this category.');
      }

      const updatedTrackKeys = [...votedTrackKeys, targetTrackKey];
      setVotedTrackKeys(updatedTrackKeys);
      setVotedNominationIds((prev) => [...prev, selectedNominationId]);
      if (!votedCategoryIds.includes(activeCategory.id)) {
        setVotedCategoryIds((prev) => [...prev, activeCategory.id]);
      }

      // Check if opposite gender track is available in this same category
      let canVoteOtherTrack = false;
      let otherTrackName = '';
      if (isCurrentGendered) {
        if (nomTrack === 'male' && !updatedTrackKeys.includes(`${activeCategory.id}_female`)) {
          canVoteOtherTrack = true;
          otherTrackName = 'Female Track';
        } else if (nomTrack === 'female' && !updatedTrackKeys.includes(`${activeCategory.id}_male`)) {
          canVoteOtherTrack = true;
          otherTrackName = 'Male Track';
        }
      }

      const trackDisplay = nomTrack === 'male' ? ' (Male Award Track)' : nomTrack === 'female' ? ' (Female Award Track)' : '';

      // Trigger Joyful Confirmation Popup
      setJustVotedInfo({
        artistName: selectedNom?.artist?.stage_name || selectedNom?.artist?.full_name || selectedNom?.title || 'Artist',
        categoryName: `${activeCategory.name}${trackDisplay}`,
        totalVoted: updatedTrackKeys.length,
        subCategory: nomTrack,
        canVoteOtherTrack,
        otherTrackName,
      });

      setSelectedNominationId('');
      setVoteSuccessNotice(
        `Thank you for voting! Your vote for ${selectedNom?.artist?.stage_name || 'this artist'} in ${activeCategory.name}${trackDisplay} has been confirmed.`
      );

      // Re-fetch ballot data
      await fetchBallot();
    } catch (err: any) {
      setError(err.message || 'Error casting vote.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Move to next unvoted category/track after success modal
  const handleProceedToNextCategory = (preferredFilter?: 'male' | 'female') => {
    setJustVotedInfo(null);
    setSelectedNominationId('');

    if (preferredFilter && isCurrentGendered) {
      setActiveGenderFilter(preferredFilter);
      return;
    }

    // Look for category with unvoted tracks
    const unvoted = categories.filter((c) => {
      if (isGenderedCategory(c.id)) {
        return !votedTrackKeys.includes(`${c.id}_male`) || !votedTrackKeys.includes(`${c.id}_female`);
      }
      return !votedTrackKeys.includes(`${c.id}_general`) && !votedCategoryIds.includes(c.id);
    });

    if (unvoted.length > 0) {
      setActiveCategoryId(unvoted[0].id);
      setActiveGenderFilter('all');
    }
  };

  // Loading Screen
  if (loading && categories.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#0f2d59] mb-4" />
        <h3 className="text-base font-bold text-slate-800">
          Loading Official Voting Ballot...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Preparing your verified voting desk...
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW A: ALL 12 AWARD TRACKS COMPLETED - OFFICIAL RECEIPT
  // ─────────────────────────────────────────────────────────────────
  if (allBallotCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
        {/* Certificate Card */}
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl overflow-hidden p-6 sm:p-10 space-y-6 relative">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] uppercase font-black px-4 py-1 rounded-bl-xl tracking-widest shadow">
            Official Ballot Cast • 12/12 Tracks Completed
          </div>

          <div className="text-center space-y-3 pt-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border-2 border-emerald-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 block">
              Official Voting Certificate &amp; Thank You
            </span>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dharti Abba Veer Birsa Munda Cultural &amp; Film Awards 2026
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Thank you for voting! Your voice across all 12 official award tracks truly values and empowers our talented artists and keeps our rich tribal heritage thriving.
            </p>
          </div>

          {/* Voter Info Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Verified Voter:</span>
              <span className="font-mono font-bold text-slate-900">
                {voterPhone ? `+91 ${voterPhone}` : voterEmail || 'Verified Citizen'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Votes Cast:</span>
              <span className="font-bold text-emerald-700">12 of 12 Award Tracks Complete</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Status:</span>
              <span className="font-bold text-slate-900">All Votes Confirmed</span>
            </div>
          </div>

          {/* Breakdown of 12 votes */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Your 12 Official Award Votes Cast:
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
              {ballotVotes.map((vote, idx) => {
                const subCatLabel =
                  vote.sub_category === 'male'
                    ? '👨 Male Track'
                    : vote.sub_category === 'female'
                    ? '👩 Female Track'
                    : 'Award Track';

                const cat = categories.find((c) => c.id === vote.category_id);

                return (
                  <div key={vote.id || idx} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {cat?.name || 'Award Category'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {subCatLabel}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] truncate block">
                          {vote.artist?.stage_name || vote.nomination?.title || 'Vote Confirmed'}
                        </span>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1 shrink-0 text-[11px]">
                      <Check className="w-3.5 h-3.5" />
                      Voted
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Immediate Exit Button */}
          <div className="text-center pt-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-4 px-6 rounded-2xl bg-[#0f2d59] hover:bg-blue-900 text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Log Out & Exit Voting Session'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW B: VOTING DESK (VOTE FOR WHOEVER YOU WANT, EXIT ANYTIME)
  // ─────────────────────────────────────────────────────────────────
  const votedTracksCount = votedTrackKeys.length;
  const totalTracks = 12;
  const progressPercent = Math.min(100, Math.round((votedTracksCount / totalTracks) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Voter Verification Modal (Triggered on login / before vote) */}
      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          setShowPhoneModal(false);
          fetchBallot();
        }}
        title="Verify Your Email to Vote"
        description="To keep voting fair and support your favorite artists, please enter your email address to receive a free 6-digit verification code."
      />

      {/* POPUP MODAL: VOTE SUCCESS CONFIRMATION */}
      {justVotedInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border-2 border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full inline-block">
                Thank You for Voting!
              </span>
              <h3 className="text-xl font-black text-slate-900">
                {justVotedInfo.artistName}
              </h3>
              <p className="text-xs text-slate-600">
                Category: <strong>{justVotedInfo.categoryName}</strong>
              </p>
              <p className="text-xs sm:text-sm text-emerald-900 font-semibold bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 leading-relaxed">
                Thank you for voting! Your vote truly matters and adds great value, encouragement, and support to our artists and their craft.
              </p>
            </div>

            {/* Prompt for opposite track in gendered category */}
            {justVotedInfo.canVoteOtherTrack && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-left space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {justVotedInfo.otherTrackName} Vote Available in This Category!
                </span>
                <p className="text-xs text-amber-800">
                  You can also cast a separate vote for the <strong>{justVotedInfo.otherTrackName}</strong> in this category!
                </p>
              </div>
            )}

            <div className="text-xs text-slate-500 font-medium">
              Ballot Progress: <strong>{justVotedInfo.totalVoted} of {totalTracks} Award Tracks Voted</strong>
            </div>

            <div className="space-y-2.5 pt-1">
              {justVotedInfo.canVoteOtherTrack && (
                <button
                  onClick={() =>
                    handleProceedToNextCategory(
                      justVotedInfo.subCategory === 'male' ? 'female' : 'male'
                    )
                  }
                  className="w-full py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Vote for {justVotedInfo.otherTrackName} Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Option 1: Continue voting for other artists */}
              <button
                onClick={() => handleProceedToNextCategory()}
                className="w-full py-3 px-5 rounded-2xl bg-[#0f2d59] hover:bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Vote for Another Category / Artist</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Option 2: Exit and Logout cleanly */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log Out & Exit Session'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner & Voter Session Control */}
      <div className="bg-[#0f2d59] text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden tribal-pattern-bg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
              <Vote className="w-3.5 h-3.5" />
              <span>Citizen Voting Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Dharti Abba Veer Birsa Munda Voting Desk
            </h1>
            <p className="text-xs sm:text-sm text-blue-200">
              Vote for the artists you love! For Categories 2, 3, 4, and 5, you can cast separate votes for both Male and Female award tracks (12 award tracks total). You can log out anytime once you are done.
            </p>
          </div>

          {/* Voter Status & Direct Log Out Button */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-right shrink-0 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Voter Status</span>
              <span className="text-xs font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                {isVerified ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {voterPhone ? `+91 ${voterPhone}` : voterEmail || 'Verified'}
                  </>
                ) : (
                  <button
                    onClick={() => setShowPhoneModal(true)}
                    className="text-amber-300 underline font-extrabold flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Login via Email OTP</span>
                  </button>
                )}
              </span>
            </div>

            {/* Logout Button in Header Bar */}
            {isVerified && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full py-1.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3 h-3 text-red-300" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log Out & Exit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar (X / 12 Award Tracks) */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-bold text-blue-100">
            <span>
              Ballot Progress: <strong>{votedTracksCount} of {totalTracks} Award Tracks Voted</strong>
            </span>
            <span className="text-amber-300">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-blue-950/80 overflow-hidden border border-blue-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 8-Category Selector Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
          <span>Award Categories (Click any category to view and vote for artists):</span>
          <span className="text-slate-500">Pick any category in any order</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {categories.map((cat, idx) => {
            const isGendered = isGenderedCategory(cat.id);
            const isMaleVoted = votedTrackKeys.includes(`${cat.id}_male`);
            const isFemaleVoted = votedTrackKeys.includes(`${cat.id}_female`);
            const isBothVoted = isMaleVoted && isFemaleVoted;
            const isPartialVoted = isMaleVoted || isFemaleVoted;
            const isGeneralVoted =
              votedTrackKeys.includes(`${cat.id}_general`) || votedCategoryIds.includes(cat.id);

            const isFullyComplete = isGendered ? isBothVoted : isGeneralVoted;
            const isActive = cat.id === activeCategoryId;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setActiveGenderFilter('all');
                  setSelectedNominationId('');
                  setError(null);
                  setVoteSuccessNotice(null);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 cursor-pointer ${
                  isActive
                    ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-md ring-2 ring-blue-500'
                    : isFullyComplete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isPartialVoted
                    ? 'bg-blue-50 border-blue-300 text-blue-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : isFullyComplete
                        ? 'bg-emerald-600 text-white'
                        : isPartialVoted
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isFullyComplete ? '✓' : idx + 1}
                  </span>
                  {isFullyComplete ? (
                    <span className="text-[9px] font-extrabold uppercase text-emerald-700">
                      {isGendered ? '✓ Both' : 'Voted'}
                    </span>
                  ) : isPartialVoted ? (
                    <span className="text-[9px] font-extrabold uppercase text-blue-700">
                      1/2 Voted
                    </span>
                  ) : isGendered ? (
                    <span className="text-[8px] font-bold text-slate-400">
                      M &amp; F
                    </span>
                  ) : null}
                </div>

                <span className="text-[11px] font-bold line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {voteSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs sm:text-sm text-emerald-900 font-bold flex items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{voteSuccessNotice}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-black text-emerald-950 bg-emerald-200 hover:bg-emerald-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Log Out Now
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-xs sm:text-sm text-red-900 font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Category Nominees Showcase */}
      {activeCategory && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600">
                  {isCurrentCategoryFullyVoted
                    ? isCurrentGendered
                      ? '✓ Both Male & Female Votes Cast'
                      : 'Category Vote Recorded'
                    : isCurrentGendered && (isMaleTrackVoted || isFemaleTrackVoted)
                    ? '1 of 2 Tracks Voted'
                    : 'Category Open for Voting'}
                </span>
                {isCurrentGendered && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    Separate Male &amp; Female Awards
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {activeCategory.name}
              </h2>
            </div>

            {isCurrentCategoryFullyVoted ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isCurrentGendered ? '2/2 Votes Complete' : '1 Vote Cast in this Category'}
                </span>
              </span>
            ) : isCurrentGendered && (isMaleTrackVoted || isFemaleTrackVoted) ? (
              <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <Check className="w-4 h-4 text-blue-600" />
                <span>
                  {isMaleTrackVoted ? 'Male Done • Female Track Open' : 'Female Done • Male Track Open'}
                </span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>
                  {isCurrentGendered ? 'Vote for Both Male & Female' : 'Select Any Artist to Vote'}
                </span>
              </span>
            )}
          </div>

          {/* Sub-Category Gender Track Filter (Categories 2, 3, 4, 5) */}
          {isCurrentGendered && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Nominees:</span>
                <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-bold">
                  <button
                    onClick={() => {
                      setActiveGenderFilter('all');
                      setSelectedNominationId('');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeGenderFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({activeNominations.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveGenderFilter('male');
                      setSelectedNominationId('');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeGenderFilter === 'male'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>👨 Male Track ({activeNominations.filter((n) => n.sub_category === 'male').length})</span>
                    {isMaleTrackVoted && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-black">
                        ✓
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveGenderFilter('female');
                      setSelectedNominationId('');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeGenderFilter === 'female'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>👩 Female Track ({activeNominations.filter((n) => n.sub_category === 'female').length})</span>
                    {isFemaleTrackVoted && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-black">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-500">
                Tracks: {isMaleTrackVoted ? '👨 Male ✓' : '👨 Male ⭕'} • {isFemaleTrackVoted ? '👩 Female ✓' : '👩 Female ⭕'}
              </div>
            </div>
          )}

          {/* Nominees Grid */}
          {filteredNominations.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Award className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                No approved nominations in this view.
              </h4>
              <p className="text-xs text-slate-500">
                {isCurrentGendered && activeGenderFilter !== 'all'
                  ? `No nominations currently listed under the ${activeGenderFilter} track. Try selecting 'All' above.`
                  : 'Audition recordings are actively undergoing jury review.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNominations.map((nom) => {
                const isSelected = selectedNominationId === nom.id;
                const isAlreadyVotedNom = votedNominationIds.includes(nom.id);
                const nomTrack = isCurrentGendered ? (nom.sub_category || 'general') : 'general';
                const trackKey = `${activeCategory.id}_${nomTrack}`;
                const isThisTrackVoted = votedTrackKeys.includes(trackKey);
                const isCategoryLocked = isCurrentGendered ? isThisTrackVoted : isCurrentCategoryFullyVoted;
                const videoUrl = nom.upload_record?.public_url;

                return (
                  <div
                    key={nom.id}
                    onClick={() => {
                      if (!isVerified) {
                        setShowPhoneModal(true);
                        return;
                      }
                      if (!isCategoryLocked && !isAlreadyVotedNom) {
                        setSelectedNominationId(nom.id);
                        setError(null);
                      }
                    }}
                    className={`rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                      isAlreadyVotedNom
                        ? 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/30 shadow-md'
                        : isSelected
                        ? 'border-[#0f2d59] ring-4 ring-blue-500/20 shadow-lg bg-blue-50/40 cursor-pointer'
                        : isCategoryLocked
                        ? 'border-slate-200 bg-slate-50 opacity-75'
                        : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Sub-category Gender Track Badge for Categories 2, 3, 4, 5 */}
                      {isCurrentGendered && (
                        <div
                          className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-3 flex items-center justify-between ${
                            nom.sub_category === 'female'
                              ? 'bg-pink-100 text-pink-900 border-b border-pink-200'
                              : 'bg-blue-100 text-blue-900 border-b border-blue-200'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{nom.sub_category === 'female' ? '👩 Female Track' : '👨 Male Track'}</span>
                          </span>
                          <span className="text-[9px] font-normal lowercase text-slate-500">
                            separate award
                          </span>
                        </div>
                      )}

                      {/* Voted Badge Header if already voted for this artist */}
                      {isAlreadyVotedNom && (
                        <div className="bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-3 flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>You Voted for this Artist (Vote Locked)</span>
                        </div>
                      )}

                      {/* Video Player */}
                      <div className="aspect-video bg-black relative">
                        {videoUrl ? (
                          <VideoPlayer src={videoUrl} title={nom.title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                            Video unavailable
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                            {nom.title}
                          </h4>
                          <span className="text-[11px] font-bold text-amber-600 shrink-0">
                            ★ {nom.vote_count} votes
                          </span>
                        </div>

                        {/* Artist Info */}
                        <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {nom.artist?.avatar_url ? (
                              <img
                                src={nom.artist.avatar_url}
                                alt="Artist"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              nom.artist?.stage_name?.charAt(0) || 'A'
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {nom.artist?.stage_name || nom.artist?.full_name}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {nom.artist?.district}, {nom.artist?.state}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Button Action Bar */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/60">
                      {isAlreadyVotedNom ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Already Voted for this Artist</span>
                        </button>
                      ) : isThisTrackVoted ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {nomTrack === 'female'
                              ? 'Female Track Vote Used'
                              : nomTrack === 'male'
                              ? 'Male Track Vote Used'
                              : 'Category Vote Used'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isVerified) {
                              setShowPhoneModal(true);
                              return;
                            }
                            setSelectedNominationId(nom.id);
                            setError(null);
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0f2d59] text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                            }`}
                          />
                          <span>
                            {isSelected
                              ? 'Selected for Vote'
                              : `Vote for this ${nomTrack === 'female' ? 'Female' : nomTrack === 'male' ? 'Male' : ''} Artist`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirm Vote Bar */}
          {selectedNominationId && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 animate-fade-in">
              <div className="text-xs text-slate-700 space-y-0.5">
                <span className="font-bold text-slate-900 block">
                  Selected Nominee:{' '}
                  <strong>
                    {activeNominations.find((n) => n.id === selectedNominationId)?.artist?.stage_name ||
                      activeNominations.find((n) => n.id === selectedNominationId)?.title}
                  </strong>
                </span>
                <span className="text-[11px] text-amber-900 font-semibold">
                  Track:{' '}
                  {activeNominations.find((n) => n.id === selectedNominationId)?.sub_category === 'female'
                    ? '👩 Female Award Track'
                    : activeNominations.find((n) => n.id === selectedNominationId)?.sub_category === 'male'
                    ? '👨 Male Award Track'
                    : 'Award Track'}{' '}
                  in {activeCategory.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCastCategoryVote}
                  disabled={isSubmittingVote}
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSubmittingVote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Your Vote...</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>Confirm Vote ({votedTracksCount + 1} of {totalTracks})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persistent Voter Exit & Logout Strip */}
      {isVerified && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Verified Voter: <strong>{voterPhone ? `+91 ${voterPhone}` : voterEmail || 'Verified Citizen'}</strong> • You have cast <strong>{votedTracksCount} of {totalTracks}</strong> votes.
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span>{isLoggingOut ? 'Logging out...' : 'Log Out & Exit Session'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0f2d59]" />
        </div>
      }
    >
      <VotePageContent />
    </Suspense>
  );
}
