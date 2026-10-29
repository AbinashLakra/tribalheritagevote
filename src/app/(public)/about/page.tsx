import { MapPin, Award, ShieldCheck, Heart, Sparkles, Users } from 'lucide-react';

export const metadata = {
  title: 'About Us — Tribal Heritage Vote',
  description: 'Learn about our mission to celebrate, preserve, and recognize authentic Adivasi artists across India, based in Rourkela, Odisha.',
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Our Cultural Mission
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-charcoal-900 tracking-tight">
          Preserving and Elevating India&rsquo;s Indigenous Arts
        </h1>
        <p className="text-base md:text-lg text-charcoal-600 leading-relaxed">
          Headquartered in the heart of the tribal belt in Rourkela, Sundargarh district, Odisha, our platform bridges ancient indigenous oral and visual traditions with modern democratic technology.
        </p>
      </div>

      {/* Origin Story */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-ivory-300 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase">
          <MapPin className="w-3.5 h-3.5" />
          Roots in Sundargarh, Odisha
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-charcoal-900">
          From the Sacred Sal Groves to the National Stage
        </h2>
        <div className="space-y-4 text-sm md:text-base text-charcoal-700 leading-relaxed">
          <p>
            The Adivasi communities of India—including the Santhal, Ho, Munda, Oraon, Gond, Bhil, Saora, and Kharia—have nurtured sacred musical traditions, earthen mural painting, and community dance forms for thousands of years. Yet, master practitioners living in remote rural regions often lack national platforms to showcase their craft.
          </p>
          <p>
            <strong>Tribal Heritage Vote</strong> was conceived to establish a permanent, respectful, and technologically advanced digital ecosystem where indigenous artists can submit high-definition recordings of their performances. Citizens from all corners of India can learn about diverse tribal expressions, watch authentic folklore, and vote for their favorite artists.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900">Cultural Authenticity</h3>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Every submission is reviewed by an experienced cultural advisory committee to verify indigenous heritage and respect traditional customs.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-ivory-300 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900">Democratic Integrity</h3>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Strict one-vote-per-citizen rule enforced cryptographically via mobile OTP and PostgreSQL database constraints. Zero bot manipulation.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-ivory-300 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-earth-100 text-earth-800 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900">Community Empowerment</h3>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Connecting indigenous artists directly with festival curators, cultural researchers, and patrons across India and the globe.
          </p>
        </div>
      </div>
    </div>
  );
}

