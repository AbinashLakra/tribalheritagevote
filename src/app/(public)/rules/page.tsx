import { ShieldCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Official Contest & Voting Rules',
  description: 'Learn the guidelines, artist eligibility, and voting rules governing the National Adivasi Cultural Arts Awards.',
};

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Governance &amp; Integrity
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Official Contest &amp; Voting Regulations
        </h1>
        <p className="text-base text-charcoal-600">
          These rules ensure fairness, transparency, and cultural authenticity for all participants.
        </p>
      </div>

      {/* Rule 1: The One-Vote Rule */}
      <div className="bg-white p-8 rounded-2xl border-2 border-forest-600 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-forest-100 text-forest-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-charcoal-900">
            Rule 1: The Fundamental One-Vote Guarantee
          </h2>
        </div>
        <div className="text-sm text-charcoal-700 space-y-2 leading-relaxed">
          <p>
            <strong>ONE VERIFIED VOTER ACCOUNT = ONE ACCEPTED VOTE = ONE SELECTED CANDIDATE.</strong>
          </p>
          <p>
            In any given contest edition, an eligible citizen may vote for only one artist. Once cast, a vote is final, permanent, and cannot be changed or transferred to another candidate.
          </p>
          <p>
            This rule is enforced at the PostgreSQL database level using a hard unique constraint (<code>UNIQUE(contest_id, voter_id)</code>). Any concurrent or retried requests are automatically rolled back.
          </p>
        </div>
      </div>

      {/* Rule 2: Voter Verification */}
      <div className="bg-white p-8 rounded-2xl border border-ivory-300 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900">Rule 2: Mobile OTP Verification</h2>
        <div className="text-sm text-charcoal-700 space-y-2 leading-relaxed">
          <p>
            Voters must verify an active Indian mobile number (+91) via a one-time password (OTP).
          </p>
          <p>
            To protect citizen privacy, mobile numbers are never displayed publicly and are hashed using SHA-256 for internal identity linkage.
          </p>
        </div>
      </div>

      {/* Rule 3: Artist Eligibility & Video Authenticity */}
      <div className="bg-white p-8 rounded-2xl border border-ivory-300 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900">Rule 3: Artist Nomination &amp; Jury Review</h2>
        <div className="text-sm text-charcoal-700 space-y-2 leading-relaxed">
          <p>
            Artists must be authentic members or practitioners of recognized Adivasi / indigenous communities of India.
          </p>
          <p>
            All submitted performance videos must be original recordings of traditional folk dances, songs, paintings, or crafts. No synthesized AI-generated or copyrighted commercial media is permitted.
          </p>
          <p>
            Nominations must be approved by the cultural jury before appearing in the public voting directory.
          </p>
        </div>
      </div>

      {/* Rule 4: Tie-Breaking Policy */}
      <div className="bg-white p-8 rounded-2xl border border-ivory-300 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900">Rule 4: Tie-Breaking Policy</h2>
        <div className="text-sm text-charcoal-700 space-y-2 leading-relaxed">
          <p>
            In the event that two or more approved artists in the same category receive identical accepted vote totals upon contest closure:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Primary Tie-Breaker: The candidate whose total votes were reached at the earliest server timestamp wins.</li>
            <li>Secondary Tie-Breaker: Recommendation and artistic assessment by the cultural jury panel.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

