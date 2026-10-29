export const metadata = {
  title: 'Privacy Policy — Voter Identity & Data Protection',
  description: 'How we safeguard citizen mobile numbers and artist data under strict privacy standards.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="space-y-2 border-b border-ivory-300 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Legal &amp; Compliance
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Privacy Policy &amp; Voter Data Protection
        </h1>
        <p className="text-sm text-charcoal-500">Last updated: October 2026</p>
      </div>

      <div className="space-y-6 text-sm text-charcoal-700 leading-relaxed bg-white p-8 md:p-10 rounded-2xl border border-ivory-300">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">1. Commitment to Privacy</h2>
          <p>
            The Tribal Heritage Vote platform respects citizen privacy. Our voting infrastructure is architected to preserve democratic transparency while safeguarding the anonymity of personal phone numbers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">2. Phone Number Hashing &amp; Zero Disclosure</h2>
          <p>
            When you verify your mobile number for voting, the system computes a one-way cryptographic SHA-256 hash. This hash is stored in our internal voter registry solely to prevent duplicate ballots.
          </p>
          <p>
            Your plaintext phone number is <strong>never displayed publicly</strong>, never shared with third-party marketers, and never exposed in API payloads.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">3. Media &amp; Content Rights</h2>
          <p>
            Performance videos submitted by artists remain the intellectual and cultural property of the respective artists and traditional lineages. By uploading, artists grant a non-exclusive license to showcase their video on this platform for evaluation and citizen voting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">4. Data Retention</h2>
          <p>
            Certified result snapshots and voting audit logs are maintained in an immutable state for historical and cultural archival purposes.
          </p>
        </section>
      </div>
    </div>
  );
}

