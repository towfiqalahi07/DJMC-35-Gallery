'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

interface ProfileProps {
  id: string;
  name: string;
  photoUrl: string;
  district: string;
  hscBatch: string;
  admissionRoll: string;
  bloodGroup: string;
  college: string;
  phone: string;
  is_approved: boolean;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profiles, setProfiles] = useState<ProfileProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/profiles', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      const data = await res.json();
      setProfiles(data.profiles);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to approve');

      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to reject');

      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-zinc-400 text-sm">Enter the admin password to manage profiles.</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-white py-3 font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Pending Approvals</h1>
            <p className="text-zinc-400 mt-1">Review and approve new student profiles.</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-full text-sm">
            {profiles.length} pending
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white">All caught up!</h3>
            <p className="text-zinc-500 mt-2">There are no pending profiles to review.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-zinc-700">
                  <Image src={profile.photoUrl} alt={profile.name} fill className="object-cover" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                  <div className="text-sm text-zinc-400 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    <p>Phone: <span className="text-zinc-300">{profile.phone}</span></p>
                    <p>Roll: <span className="text-zinc-300">{profile.admissionRoll}</span></p>
                    <p>College: <span className="text-zinc-300">{profile.college}</span></p>
                    <p>District: <span className="text-zinc-300">{profile.district}</span></p>
                  </div>
                </div>

                <div className="flex w-full sm:w-auto gap-3 pt-4 sm:pt-0 border-t border-white/5 sm:border-t-0">
                  <button
                    onClick={() => handleReject(profile.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium text-sm"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(profile.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
