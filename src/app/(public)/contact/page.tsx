import { MapPin, Mail, Phone, Clock, TreePine } from 'lucide-react';

export const metadata = {
  title: 'Contact Us — Organizing Secretariat',
  description: 'Reach our organizing committee in Rourkela, Sundargarh district, Odisha.',
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Get in Touch
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">
          Cultural Organizing Secretariat
        </h1>
        <p className="text-sm md:text-base text-charcoal-600">
          Have inquiries regarding artist nominations, festival partnerships, or media coverage?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info Card */}
        <div className="bg-forest-900 text-white p-8 md:p-10 rounded-3xl space-y-8 tribal-pattern-bg">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-ivory-100">
              <TreePine className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold">Rourkela Secretariat</h2>
            <p className="text-sm text-ivory-200 leading-relaxed">
              Serving tribal communities across Sundargarh, Mayurbhanj, Keonjhar, and national tribal regions.
            </p>
          </div>

          <div className="space-y-4 text-sm divide-y divide-forest-800">
            <div className="pt-2 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-terracotta-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Physical Secretariat</p>
                <p className="text-xs text-ivory-200 mt-0.5">
                  Civil Township, Panposh Road, Rourkela, Sundargarh, Odisha — 769004, India
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-terracotta-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">General Inquiries</p>
                <p className="text-xs text-ivory-200 mt-0.5">
                  contact@tribalheritagevote.in
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-terracotta-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Working Hours</p>
                <p className="text-xs text-ivory-200 mt-0.5">
                  Monday to Saturday: 10:00 AM – 6:00 PM IST
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-ivory-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-charcoal-900">Send an Inquiry</h3>

          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-charcoal-700 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                placeholder="Shri / Smt..."
                className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-sm text-charcoal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-charcoal-700 mb-1">
                Mobile Number or Email
              </label>
              <input
                type="text"
                placeholder="+91 or email..."
                className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-sm text-charcoal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-charcoal-700 mb-1">
                Message / Query
              </label>
              <textarea
                rows={4}
                placeholder="How can we assist you with the nomination or voting process?"
                className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-sm text-charcoal-900"
              />
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Submit Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

