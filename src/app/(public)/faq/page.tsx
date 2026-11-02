import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'Frequently Asked Questions (FAQ)',
  description: 'Find answers about artist eligibility, voting verification, video uploads, and contest rules.',
};

const FAQS = [
  {
    q: 'Who can nominate themselves as an Adivasi artist?',
    a: 'Any indigenous folk practitioner, traditional troupe, singer, dancer, painter, or craftsman belonging to recognized tribal communities across India (such as Santhal, Ho, Munda, Oraon, Gond, Bhil, Saora, etc.) may submit a nomination.',
  },
  {
    q: 'How does mobile OTP voting work?',
    a: 'When you click "Vote for this Artist", enter your 10-digit Indian mobile number (+91). You will receive a 6-digit SMS code. Once verified, your ballot is permanently recorded. Each mobile identity may cast strictly one vote per contest.',
  },
  {
    q: 'Can I change my vote after submitting?',
    a: 'No. To prevent manipulation and maintain the integrity of results, all cast votes are final, irreversible, and stored in an append-only cryptographic database ledger.',
  },
  {
    q: 'Are my phone number and personal details public?',
    a: 'Never. Your mobile number is encrypted, hashed using SHA-256 for duplicate-prevention, and never sold, shared, or displayed in public directories.',
  },
  {
    q: 'What video formats, durations, and file sizes are supported for nominations?',
    a: 'We accept MP4, WebM, and QuickTime (MOV) formats up to 100MB. Video duration must be strictly between 30 seconds and 60 seconds (1 minute). Files are uploaded directly to Cloudflare R2 storage for high performance.',
  },
  {
    q: 'Why is my nomination marked "Under Review"?',
    a: 'Our cultural moderation committee in Rourkela verifies each performance for cultural authenticity, audio/video quality, and community representation before opening it to public voting.',
  },
  {
    q: 'When are official contest results published?',
    a: 'Once the voting deadline passes, the administration committee audits the totals, generates an immutable result snapshot, and publishes certified certificates on the Results page.',
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Got Questions?
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Frequently Asked Questions
        </h1>
        <p className="text-sm md:text-base text-charcoal-600">
          Everything you need to know about nominating artists, voting rules, and cultural preservation.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div
            key={index}
            className="p-6 bg-white rounded-2xl border border-ivory-300 shadow-xs space-y-2"
          >
            <h3 className="text-base font-bold text-charcoal-900 flex items-start gap-2">
              <span className="text-forest-700 font-extrabold">Q.</span>
              <span>{faq.q}</span>
            </h3>
            <p className="text-sm text-charcoal-700 leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

