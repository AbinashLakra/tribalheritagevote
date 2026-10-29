export const metadata = {
  title: 'Terms of Service — Platform Guidelines',
  description: 'Terms governing participation, artist nominations, and public voting.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="space-y-2 border-b border-ivory-300 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Governance
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Terms of Service &amp; Code of Cultural Conduct
        </h1>
        <p className="text-sm text-charcoal-500">Effective Date: October 2026</p>
      </div>

      <div className="space-y-6 text-sm text-charcoal-700 leading-relaxed bg-white p-8 md:p-10 rounded-2xl border border-ivory-300">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">1. Acceptance of Terms</h2>
          <p>
            By accessing Tribal Heritage Vote or casting a ballot, you agree to comply with all contest rules, integrity requirements, and national laws of India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">2. Prohibited Conduct</h2>
          <p>
            The following actions are strictly prohibited and will result in immediate disqualification or legal referral:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Attempting automated vote-stuffing, bot scripts, or virtual SIM abuse.</li>
            <li>Uploading defamatory, culturally disrespectful, or non-indigenous content.</li>
            <li>Bypassing rate limits or attempting unauthorized penetration of backend APIs.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal-900">3. Moderation Discretion</h2>
          <p>
            The cultural evaluation committee reserves the full right to accept, reject, or request corrections on any submission based on cultural authenticity and video quality.
          </p>
        </section>
      </div>
    </div>
  );
}

