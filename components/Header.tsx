'use client';

import Link from 'next/link';
import { UserPlus, LogIn, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        // If we just signed in and we are on the home page, redirect to profile
        if (window.location.pathname === '/') {
          window.location.href = '/profile';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
  };

  const navLinks = [
    { name: 'Directory', href: '/directory' },
    { name: 'About Batch', href: '/about' },
    { name: 'Announcements', href: '/announcements' },
    { name: 'Resources', href: '/resources' },
    { name: 'Polls', href: '/polls' },
    { name: 'Statistics', href: '/stats' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-bold text-xl">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-white leading-none">
              DjMC 35
            </span>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5 leading-none">
              Dinajpur Medical College
            </span>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-white transition-colors">
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-5 h-5 md:w-5 md:h-5 rounded-full" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          ) : (
            <button
              onClick={handleSignIn}
              className="hidden md:inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-full bg-white px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-bold">Sign In</span>
            </button>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-zinc-400 hover:text-white p-1">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl absolute top-full left-0 w-full shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {!user && (
              <button
                onClick={handleSignIn}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-base font-bold text-black transition-transform hover:scale-105 active:scale-95"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed Mobile Sign In Button (Bottom) */}
      {!user && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 active:scale-95"
          >
            <LogIn className="h-5 w-5" />
            Sign In to Access Profile
          </button>
        </div>
      )}
    </header>
  );
}
