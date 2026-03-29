'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Users, Calendar, GraduationCap, Globe, ChevronLeft, ChevronRight, Droplets, Loader2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { getDivision } from '@/lib/bangladesh';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), { ssr: false });

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface ProfileProps {
  id: string;
  district: string;
  bloodGroup: string;
  college: string;
}

export default function AboutPage() {
  const [galleryImages, setGalleryImages] = useState<{id: string, url: string, category: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000, stopOnInteraction: false })]);

  // Stats state
  const [profiles, setProfiles] = useState<ProfileProps[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('/api/gallery');
        if (response.ok) {
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            const parsedImages = data.images.map((img: any) => {
              const [url, hash] = img.url.split('#category=');
              return {
                id: img.id,
                url: url,
                category: hash ? decodeURIComponent(hash) : 'General'
              };
            });
            setGalleryImages(parsedImages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGallery();

    // Fetch Stats
    async function fetchProfiles() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, district, blood_group, college')
          .eq('is_approved', true);
        
        if (error) throw error;
        
        if (data) {
          setProfiles(data.map(d => ({
            id: d.id,
            district: d.district,
            bloodGroup: d.blood_group,
            college: d.college
          })));
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchProfiles();
  }, []);

  // Calculate statistics
  const totalStudents = profiles.length;
  const uniqueDistricts = new Set(profiles.map(p => p.district)).size;
  const uniqueColleges = new Set(profiles.map(p => p.college)).size;

  // Blood group data
  const bloodGroupCounts: Record<string, number> = {};
  profiles.forEach(p => {
    bloodGroupCounts[p.bloodGroup] = (bloodGroupCounts[p.bloodGroup] || 0) + 1;
  });
  const bloodGroupData = Object.entries(bloodGroupCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // District data (top 10)
  const districtCounts: Record<string, number> = {};
  profiles.forEach(p => {
    districtCounts[p.district] = (districtCounts[p.district] || 0) + 1;
  });
  const districtData = Object.entries(districtCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Division & District Hierarchical Data
  const divisionMap: Record<string, Record<string, number>> = {};
  profiles.forEach(p => {
    const div = getDivision(p.district);
    if (!divisionMap[div]) divisionMap[div] = {};
    divisionMap[div][p.district] = (divisionMap[div][p.district] || 0) + 1;
  });

  const categories = ['All', ...Array.from(new Set(galleryImages.map(img => img.category)))];
  const filteredImages = activeCategory === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  // Re-initialize carousel when filtered images change
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [filteredImages, emblaApi]);

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 text-center px-4">
          <div className="h-24 w-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <span className="text-black font-bold text-2xl">DjMC</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-blue-400 font-bengali mt-2" suppressHydrationWarning>প্রত্যুষ্মান ৩৫</h2>
          <p className="text-xl text-blue-400 font-bengali italic mb-8" suppressHydrationWarning>&quot;জ্ঞানে দীপ্ত, সেবায় মহান— মোরা পঁয়ত্রিশ, মোরাই প্রত্যুষ্মান&quot;</p>
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg">
            We are the 35th batch of Dinajpur Medical College. A family of future doctors, united by our passion for medicine and our bond as batchmates.
          </p>
          <div className="mt-8 flex justify-center">
            <a 
              href="https://djmc.edu.bd/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
            >
              <Globe className="h-4 w-4" />
              Visit Official Website
            </a>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 max-w-4xl mx-auto px-4">
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Welcome to the official directory of Dinajpur Medical College Batch 35. 
              We are a vibrant community of future medical professionals dedicated to excellence, 
              compassion, and lifelong learning. This platform serves as a central hub to stay 
              connected, share memories, and support each other throughout our medical journey and beyond.
            </p>
          </div>
        </section>

        {/* Memories */}
        <section className="pb-20 max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Memories</h2>
          
          {galleryImages.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === category 
                      ? 'bg-white text-black' 
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {isLoading ? (
              <div className="text-center text-zinc-500 py-12 border border-white/5 rounded-3xl bg-zinc-900/30">
                Loading gallery...
              </div>
            ) : filteredImages.length > 0 ? (
              <div className="relative group">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50" ref={emblaRef}>
                  <div className="flex">
                    {filteredImages.map((img) => (
                      <div key={img.id} className="flex-[0_0_100%] min-w-0 relative aspect-video sm:aspect-[21/9]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={img.url} 
                          alt={`Gallery image - ${img.category}`} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white border border-white/10">
                          {img.category}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <button 
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-12 border border-dashed border-white/10 rounded-3xl bg-zinc-900/30">
                No images in the gallery yet.
              </div>
            )}
          </div>
        </section>

        {/* Class Representatives */}
        <section className="py-20 max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Class Representatives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
              <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl shrink-0"></div>
              <div>
                <h3 className="text-xl font-bold text-white">CR Name (Male)</h3>
                <p className="text-blue-400 text-sm font-medium mb-2">Class Representative</p>
                <p className="text-zinc-400 text-sm">Contact info will be available here.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
              <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl shrink-0"></div>
              <div>
                <h3 className="text-xl font-bold text-white">CR Name (Female)</h3>
                <p className="text-pink-400 text-sm font-medium mb-2">Class Representative</p>
                <p className="text-zinc-400 text-sm">Contact info will be available here.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Batch Statistics Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Batch Statistics</h2>
            <p className="mt-2 text-zinc-400">Overview of DjMC Batch 35 demographics.</p>
          </div>

          {/* Info Grid (Summary Stats) */}
          <div className="max-w-5xl mx-auto mb-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">200</div>
              <div className="text-sm text-zinc-400">Students</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <GraduationCap className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">1992</div>
              <div className="text-sm text-zinc-400">Established</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">25-26</div>
              <div className="text-sm text-zinc-400">Session</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <MapPin className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">Dinajpur</div>
              <div className="text-sm text-zinc-400">Location</div>
            </div>
          </div>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500">No data available yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Total Students</p>
                      <p className="text-2xl font-bold text-white">{totalStudents}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Districts Represented</p>
                      <p className="text-2xl font-bold text-white">{uniqueDistricts}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-purple-500/10 p-3 text-purple-500">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Different Colleges</p>
                      <p className="text-2xl font-bold text-white">{uniqueColleges}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-500/10 p-3 text-red-500">
                      <Droplets className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Most Common Blood</p>
                      <p className="text-2xl font-bold text-white">{bloodGroupData[0]?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Geographic Distribution Map */}
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 lg:col-span-2">
                  <h3 className="mb-2 text-lg font-semibold text-white">Geographic Distribution Map</h3>
                  <p className="mb-6 text-sm text-zinc-400">Interactive map showing student density across districts</p>
                  <div className="h-[500px] w-full mb-8">
                    <InteractiveMap districtCounts={districtCounts} />
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(divisionMap)
                      .sort((a, b) => {
                        const sumA = Object.values(a[1]).reduce((acc, val) => acc + val, 0);
                        const sumB = Object.values(b[1]).reduce((acc, val) => acc + val, 0);
                        return sumB - sumA;
                      })
                      .map(([division, districts]) => {
                        const totalInDivision = Object.values(districts).reduce((acc, val) => acc + val, 0);
                        return (
                          <div key={division} className="rounded-xl border border-white/5 bg-black/30 p-4">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                              <h4 className="font-semibold text-white">{division}</h4>
                              <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                                {totalInDivision}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(districts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([district, count]) => (
                                  <div key={district} className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">{district}</span>
                                    <span className="text-zinc-500">{count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Top Districts Chart */}
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <h3 className="mb-6 text-lg font-semibold text-white">Top 10 Districts</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: '#27272a' }}
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Blood Groups Chart */}
                <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <h3 className="mb-6 text-lg font-semibold text-white">Blood Group Distribution</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bloodGroupData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {bloodGroupData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                      {bloodGroupData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm text-zinc-400">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Location & Get in Touch */}
        <section className="py-20 bg-zinc-900/30 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Get in Touch</h2>
              <p className="text-zinc-400 mb-8">
                Have questions or need to reach out to the batch administration? Use the links below.
              </p>
              <div className="space-y-4">
                <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Official Facebook Group</h4>
                    <p className="text-sm text-zinc-500">Join our community</p>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Official WhatsApp Group</h4>
                    <p className="text-sm text-zinc-500">For urgent updates</p>
                  </div>
                </a>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Location</h2>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-800 mb-4">
                <iframe 
                  src="https://maps.google.com/maps?q=Dinajpur%20Medical%20College,%20New%20Town,%20Dinajpur,%20Bangladesh%205200&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl shrink-0">
                  <MapPin className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Address</h3>
                  <p className="text-zinc-400">
                    New Town, Dinajpur, Bangladesh.<br />
                    Postal Code: 5200.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
