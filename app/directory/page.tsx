'use client';

import { ProfileCard } from '@/components/ProfileCard';
import { Search, Map, BarChart3, UserPlus, Loader2, ChevronDown, ShieldAlert, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getDivision, divisionToDistricts } from '@/lib/bangladesh';
import { useRouter } from 'next/navigation';

interface ProfileProps {
  id: string;
  name: string;
  photoUrl: string;
  district: string;
  hscBatch: string;
  admissionRoll: string;
  bloodGroup: string;
  college: string;
  whatsapp?: string;
  facebook?: string;
}

export default function DirectoryPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'pending_approval' | 'approved'>('loading');
  const [showClassRollPopup, setShowClassRollPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAuthStatus('unauthenticated');
          setIsLoading(false);
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('students')
          .select('id, is_approved, class_roll')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!userProfile) {
          router.push('/profile');
          return;
        }

        if (!userProfile.is_approved) {
          setAuthStatus('pending_approval');
          setIsLoading(false);
          return;
        }

        // Show popup if approved but missing class roll
        if (!userProfile.class_roll) {
          setShowClassRollPopup(true);
        }

        setAuthStatus('approved');

        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('is_approved', true)
          .order('name');
        
        if (error) throw error;
        
        if (data) {
          const formattedProfiles = data.map(student => ({
            id: student.id,
            name: student.name,
            photoUrl: student.photo_url,
            district: student.district,
            hscBatch: student.hsc_batch,
            admissionRoll: student.admission_roll,
            bloodGroup: student.blood_group,
            college: student.college,
            whatsapp: student.whatsapp,
            facebook: student.facebook,
          }));
          setProfiles(formattedProfiles);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthAndFetch();
  }, [router]);

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || authStatus === 'pending_approval') {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-sm">
          <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-3">
            {authStatus === 'unauthenticated' ? 'Sign In Required' : 'Approval Pending'}
          </h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            {authStatus === 'unauthenticated' 
              ? 'You must be signed in to view the batch directory. Please log in to connect with your batchmates.' 
              : 'Your profile is currently under review by the admins. You will gain access to the directory once your profile is verified and approved.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {authStatus === 'unauthenticated' ? (
              <Link href="/" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
                Go to Home
              </Link>
            ) : (
              <Link href="/profile" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
                View Profile
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.admissionRoll?.includes(searchQuery) ||
      profile.district.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDivision = selectedDivision ? getDivision(profile.district) === selectedDivision : true;
    
    return matchesSearch && matchesDivision;
  });

  const uniqueDivisions = Object.keys(divisionToDistricts).sort();

  return (
    <>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Batch Directory
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
            The unofficial database for DjMC Batch 35. Find your batchmates, explore districts, and stay connected.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll, or district..."
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          
          <div className="relative min-w-[160px]">
            <select
              value={selectedDivision || ''}
              onChange={(e) => setSelectedDivision(e.target.value === '' ? null : e.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-zinc-900/50 py-3 pl-4 pr-10 text-sm font-medium text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
            >
              <option value="">All Divisions</option>
              {uniqueDivisions.map(division => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
              <Search className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">No profiles found</h3>
            <p className="mt-2 text-zinc-400">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </main>

      {/* Class Roll Enforcer Modal */}
      {showClassRollPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Class Roll Required</h2>
            <p className="text-zinc-400 mb-6">
              To continue accessing the directory and other features, please update your profile with your official Class Roll.
            </p>
            <Link 
              href="/profile" 
              className="inline-flex items-center justify-center w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-transform hover:bg-blue-500"
            >
              Update Profile Now
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
