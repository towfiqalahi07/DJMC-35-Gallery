'use client';

import { ProfileCard } from '@/components/ProfileCard';
import { Search, Map, BarChart3, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function HomePage() {
  const [profiles, setProfiles] = useState<ProfileProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
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

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.admissionRoll.includes(searchQuery) ||
      profile.district.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDistrict = selectedDistrict ? profile.district === selectedDistrict : true;
    
    return matchesSearch && matchesDistrict;
  });

  const uniqueDistricts = Array.from(new Set(profiles.map(p => p.district))).sort();

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-bold text-xl">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              DjMC 35
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="/" className="text-white">Directory</Link>
            <Link href="/map" className="hover:text-white transition-colors">Map View</Link>
            <Link href="/stats" className="hover:text-white transition-colors">Statistics</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/add-profile"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Batch Directory
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
            The official database for DjMC Batch 35. Find your batchmates, explore districts, and stay connected.
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
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button 
              onClick={() => setSelectedDistrict(null)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedDistrict === null 
                  ? 'border-white/10 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white' 
                  : 'border-white/10 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              All Students
            </button>
            {uniqueDistricts.map(district => (
              <button 
                key={district}
                onClick={() => setSelectedDistrict(district)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDistrict === district 
                    ? 'border-white/10 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white' 
                    : 'border-white/10 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {district}
              </button>
            ))}
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
    </div>
  );
}
