'use client';

import Link from 'next/link';
import { Github, Twitter, Facebook, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">DjMC</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">DjMC 35</span>
            </Link>
            <p className="text-zinc-400 max-w-sm mb-6">
              The unofficial directory and community platform for Dinajpur Medical College Batch 35. 
              Connecting future doctors, sharing memories, and building a legacy.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:contact@djmc35.com" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/directory" className="text-zinc-400 hover:text-white transition-colors">Student Directory</Link>
              </li>
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-white transition-colors">About Batch</Link>
              </li>
              <li>
                <Link href="/announcements" className="text-zinc-400 hover:text-white transition-colors">Announcements</Link>
              </li>
              <li>
                <Link href="/resources" className="text-zinc-400 hover:text-white transition-colors">Resources</Link>
              </li>
              <li>
                <Link href="/p-r" className="text-zinc-400 hover:text-white transition-colors">P&R (Polls)</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Legal & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li className="flex items-center gap-2 text-zinc-500 pt-2">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Dinajpur, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-sm">
            © {currentYear} DjMC Batch 35. All rights reserved.
          </p>
          <p className="text-zinc-600 text-xs italic">
            Built with ❤️ by the DJMC 35 Tech Team
          </p>
        </div>
      </div>
    </footer>
  );
}
