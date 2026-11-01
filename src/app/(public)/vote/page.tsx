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
  ArrowLeft,
  Smartphone,
  Lock,
  LogOut,
  Sparkles,
  Award,
  Video,
  MapPin,
  Clock,
  Heart,
  ChevronRight,
  Check,
} from 'lucide-react';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { PhoneVerificationModal } from '@/features/auth/components/PhoneVerificationModal';
import { createClient } from '@/lib/supabase/browser';

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface ArtistNomination {
  id: string;
  category_id: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominationsByCategory, setNominationsByCategory] = useState<Record<string, ArtistNomination[]>>({});
  const [votedCategoryIds, setVotedCategoryIds] = useState<string[]>([]);
  const [ballotVotes, setBallotVotes] = useState<BallotVoteRecord[]>([]);

  // Wizard Navigation State
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [selectedNominationId, setSelectedNominationId] = useState<string>('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSuccessNotice, setVoteSuccessNotice] = useState<string | null>(null);

  // Modals & Timers
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [autoLogoutSeconds, setAutoLogoutSeconds] = useState(15);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      setCategories(bData.categories || []);
      setNominationsByCategory(bData.nominationsByCategory || {});
      setVotedCategoryIds(bData.votedCategoryIds || []);
      setBallotVotes(bData.ballotVotes || []);

      // If voter is not verified, prompt them with verification modal
      if (!bData.isVerified) {
        setShowPhoneModal(true);
      }

      // Determine initial active category
      const unvotedCats = (bData.categories || []).filter(
        (c: Category) => !bData.votedCategoryIds?.includes(c.id)
      );

      // If user came via query param
      if (requestedCategorySlug) {
        const found = (bData.categories || []).find((c: Category) => c.slug === requestedCategorySlug);
        if (found && !bData.votedCategoryIds?.includes(found.id)) {
          setActiveCategoryId(found.id);
          if (requestedArtistId) setSelectedNominationId(requestedArtistId);
          return;
        }
      }

      // Default to first unvoted category
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

  const isCurrentCategoryVoted = useMemo(() => {
    return votedCategoryIds.includes(activeCategoryId);
  }, [votedCategoryIds, activeCategoryId]);

  const allBallotCompleted = useMemo(() => {
    return categories.length > 0 && votedCategoryIds.length >= categories.length;
  }, [categories, votedCategoryIds]);

  // Auto-Logout Countdown Timer once all 8 votes are complete
  useEffect(() => {
    if (!allBallotCompleted) return;

    const timer = setInterval(() => {
      setAutoLogoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [allBallotCompleted]);

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.replace('/');
  };

  // Submit Vote for the Active Category
  const handleCastCategoryVote = async () => {
    if (!activeCategory || !selectedNominationId) {
      setError('Please select an artist nominee in this category to cast your vote.');
      return;
    }

    if (!isVerified) {
      setShowPhoneModal(true);
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

      const newVotedCount = votedCategoryIds.length + 1;
      setVotedCategoryIds((prev) => [...prev, activeCategory.id]);
      setSelectedNominationId('');

      setVoteSuccessNotice(
        `Vote ${newVotedCount} of 8 recorded for ${activeCategory.name}!`
      );

      // Re-fetch ballot data to sync
      await fetchBallot();
    } catch (err: any) {
      setError(err.message || 'Error casting vote.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Loading Screen
  if (loading && categories.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#0f2d59] mb-4" />
        <h3 className="text-base font-bold text-slate-800">
          Loading Official 8-Category Voting Ballot...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Synchronizing verified cryptographic voting ledger
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW A: OFFICIAL BALLOT RECEIPT & THANK YOU NOTE (COMPLETED 8/8)
  // ─────────────────────────────────────────────────────────────────
  if (allBallotCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
        {/* Certificate Card */}
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl overflow-hidden p-6 sm:p-10 space-y-6 relative">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] uppercase font-black px-4 py-1 rounded-bl-xl tracking-widest shadow">
            Official Ballot Cast • 8/8 Completed
          </div>

          <div className="text-center space-y-3 pt-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border-2 border-emerald-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 block">
              Official Voting Certificate &amp; Thank You Note
            </span>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dharti Aaba Veer Birsa Munda Cultural &amp; Film Awards 2026
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Thank you for upholding tribal heritage and cultural democracy. Your vote in all 8 official award categories has been permanently recorded in the cryptographic ledger.
            </p>
          </div>

          {/* Voter Info Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Verified Voter Mobile:</span>
              <span className="font-mono font-bold text-slate-900">+91 {voterPhone || 'Verified Citizen'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Votes Cast:</span>
              <span className="font-bold text-emerald-700">8 of 8 Categories Complete</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Status:</span>
              <span className="font-bold text-slate-900">Ballot Sealed &amp; Finalized</span>
            </div>
          </div>

          {/* Breakdown of 8 votes */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Your 8 Official Award Votes:
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
              {categories.map((cat, idx) => {
                const vote = ballotVotes.find((v) => v.category_id === cat.id);
                return (
                  <div key={cat.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{cat.name}</span>
                        <span className="text-slate-500 text-[11px] truncate">
                          {vote?.artist?.stage_name || vote?.nomination?.title || 'Vote Recorded'}
                        </span>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1 shrink-0 text-[11px]">
                      <Check className="w-3.5 h-3.5" />
                      Recorded
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automatic Logout Notice & Countdown Strip */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-950">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>
                Automatic Logout in <strong>{autoLogoutSeconds} seconds</strong> for privacy &amp; security
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-200 overflow-hidden max-w-sm mx-auto">
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${(autoLogoutSeconds / 15) * 100}%` }}
              />
            </div>
          </div>

          {/* Immediate Exit Button */}
          <div className="text-center pt-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0f2d59] hover:bg-blue-900 text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Exit & Logout Ballot Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW B: STEP-BY-STEP 8-CATEGORY VOTING WIZARD
  // ─────────────────────────────────────────────────────────────────
  const votedCount = votedCategoryIds.length;
  const progressPercent = Math.round((votedCount / 8) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          setShowPhoneModal(false);
          fetchBallot();
        }}
        title="Verify Mobile Number to Vote"
        description="To ensure 1 fair ballot per verified citizen across all 8 award categories, please verify your mobile number via OTP."
      />

      {/* Header Banner & Ballot Progress */}
      <div className="bg-[#0f2d59] text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden tribal-pattern-bg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
              <Vote className="w-3.5 h-3.5" />
              <span>Mandatory 8-Category Official Ballot</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              National Adivasi Cultural Arts Voting
            </h1>
            <p className="text-xs sm:text-sm text-blue-200">
              Cast strictly 1 vote in EACH of the 8 award categories below to finalize your ballot.
            </p>
          </div>

          {/* Verified voter indicator */}
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Voter Status</span>
            <span className="text-xs font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
              {isVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  +91 {voterPhone || 'Verified'}
                </>
              ) : (
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="text-amber-300 underline font-extrabold"
                >
                  Verify via Mobile OTP
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar (X / 8 Categories) */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-bold text-blue-100">
            <span>
              Ballot Progress: <strong>{votedCount} of 8 Categories Voted</strong>
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

      {/* 8-Category Step Selector Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
          <span>Choose or Proceed through Categories (Mandatory: 8 of 8):</span>
          <span className="text-slate-500">Pick any category first, then follow sequence</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {categories.map((cat, idx) => {
            const isVoted = votedCategoryIds.includes(cat.id);
            const isActive = cat.id === activeCategoryId;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setSelectedNominationId('');
                  setError(null);
                  setVoteSuccessNotice(null);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 cursor-pointer ${
                  isActive
                    ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-md ring-2 ring-blue-500'
                    : isVoted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : isVoted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isVoted ? '✓' : idx + 1}
                  </span>
                  {isVoted && (
                    <span className="text-[9px] font-extrabold uppercase text-emerald-700">
                      Voted
                    </span>
                  )}
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{voteSuccessNotice}</span>
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
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600">
                Category Selection ({votedCategoryIds.indexOf(activeCategory.id) !== -1 ? 'Already Voted' : 'Action Required'})
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {activeCategory.name}
              </h2>
            </div>

            {isCurrentCategoryVoted ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1 Vote Cast in this Category</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center gap-1.5 self-start sm:self-auto">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Select 1 Artist to Vote</span>
              </span>
            )}
          </div>

          {/* Nominees Grid */}
          {activeNominations.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Award className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                No approved nominations in this category yet.
              </h4>
              <p className="text-xs text-slate-500">
                Audition recordings are actively undergoing jury review. Please proceed to other categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeNominations.map((nom) => {
                const isSelected = selectedNominationId === nom.id;
                const videoUrl = nom.upload_record?.public_url;

                return (
                  <div
                    key={nom.id}
                    onClick={() => {
                      if (!isCurrentCategoryVoted) {
                        setSelectedNominationId(nom.id);
                        setError(null);
                      }
                    }}
                    className={`rounded-2xl border overflow-hidden transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#0f2d59] ring-4 ring-blue-500/20 shadow-lg bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
                    }`}
                  >
                    <div>
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
                              {nom.artist?.stage_name}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {nom.artist?.district}, {nom.artist?.state}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Radio Select Button */}
                    {!isCurrentCategoryVoted && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
                        <button
                          type="button"
                          className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
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
                          <span>{isSelected ? 'Selected for Vote' : 'Select Nominee'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirm Vote Bar */}
          {!isCurrentCategoryVoted && activeNominations.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
              <div className="text-xs text-slate-600">
                {selectedNominationId ? (
                  <span className="font-bold text-slate-900">
                    Ready to cast your 1 official vote in <strong>{activeCategory.name}</strong>.
                  </span>
                ) : (
                  <span>Please click on an artist card above to select your vote.</span>
                )}
              </div>

              <button
                onClick={handleCastCategoryVote}
                disabled={!selectedNominationId || isSubmittingVote}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSubmittingVote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sealing Vote in Ledger...</span>
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4" />
                    <span>Confirm Vote ({votedCount + 1} of 8)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
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
