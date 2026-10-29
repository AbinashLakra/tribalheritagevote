'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Printer, ArrowRight, Award } from 'lucide-react';
import { formatDateIST } from '@/lib/utils/formatters';

interface ReceiptCardProps {
  voteId: string;
  contestTitle: string;
  artistName: string;
  nominationTitle: string;
  category: string;
  timestamp: string;
}

export function ReceiptCard({
  voteId,
  contestTitle,
  artistName,
  nominationTitle,
  category,
  timestamp,
}: ReceiptCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border-2 border-forest-600 shadow-xl overflow-hidden print:border-none print:shadow-none">
      {/* Top Banner */}
      <div className="bg-forest-700 text-white p-6 text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-forest-600 flex items-center justify-center text-ivory-100 mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-terracotta-300">
          Official Digital Ballot
        </span>
        <h2 className="text-2xl font-bold">Vote Verified & Recorded</h2>
        <p className="text-xs text-ivory-200">
          Permanent, immutable record in PostgreSQL ledger
        </p>
      </div>

      {/* Ballot Body */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-4 text-sm divide-y divide-ivory-200">
          <div className="pt-2">
            <span className="text-xs font-semibold text-charcoal-500 uppercase">
              Contest Edition
            </span>
            <p className="font-bold text-charcoal-900 mt-0.5">{contestTitle}</p>
          </div>

          <div className="pt-4">
            <span className="text-xs font-semibold text-charcoal-500 uppercase">
              Voted For Artist
            </span>
            <p className="text-lg font-bold text-forest-800 mt-0.5 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-terracotta-500" />
              {artistName}
            </p>
            <p className="text-xs text-charcoal-700 mt-0.5">&ldquo;{nominationTitle}&rdquo;</p>
            <p className="text-xs text-charcoal-500 mt-0.5">Category: {category}</p>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-charcoal-500 uppercase">
                Recorded Time (IST)
              </span>
              <p className="font-semibold text-charcoal-800 text-xs mt-0.5">
                {formatDateIST(timestamp)}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-charcoal-500 uppercase">
                Integrity Status
              </span>
              <p className="font-semibold text-forest-700 text-xs mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Non-Duplicate
              </p>
            </div>
          </div>

          <div className="pt-4">
            <span className="text-xs font-semibold text-charcoal-500 uppercase">
              Cryptographic Receipt ID
            </span>
            <p className="font-mono text-xs text-charcoal-700 bg-ivory-100 p-2.5 rounded-lg border border-ivory-300 break-all select-all mt-1">
              {voteId}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:flex-1 py-2.5 px-4 border border-ivory-400 hover:bg-ivory-100 text-charcoal-800 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>

          <Link
            href="/leaderboard"
            className="w-full sm:flex-1 py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            View Leaderboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

