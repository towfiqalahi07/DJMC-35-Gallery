import Header from '@/components/Header';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="flex-1 bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-20 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Contact Support</h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Have a question, suggestion, or need help with your account? Reach out to us using the details below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
            <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Email Us</h3>
                  <p className="text-zinc-400 text-sm mb-2">For general inquiries and support.</p>
                  <a href="mailto:support@djmc35.com" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    support@djmc35.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Call Us</h3>
                  <p className="text-zinc-400 text-sm mb-2">Mon-Fri from 9am to 5pm.</p>
                  <a href="tel:+8801234567890" className="text-blue-400 hover:text-blue-300 transition-colors">
                    +880 1234 567 890
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Location</h3>
                  <p className="text-zinc-400 text-sm">
                    Dhaka, Bangladesh
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-white/5 rounded-full mb-6">
              <MessageSquare className="h-10 w-10 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">Feedback & Suggestions</h2>
            <p className="text-zinc-400 mb-8">
              We are constantly looking to improve the portal. If you have any feature requests or found a bug, please let us know!
            </p>
            <a 
              href="mailto:support@djmc35.com?subject=Feedback%20for%20DJMC%2035%20Portal"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors w-full"
            >
              Send Feedback
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
