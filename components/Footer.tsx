import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/5 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">DJMC '35 Batch</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The unofficial database and portal for DjMC Batch 35. Stay connected, explore resources, and keep up with the latest announcements.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-zinc-500 shrink-0" />
                <span>support@djmc35.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} DJMC '35 Batch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
