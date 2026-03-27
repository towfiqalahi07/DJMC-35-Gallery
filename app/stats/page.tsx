'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Users, MapPin, GraduationCap, Droplets } from 'lucide-react';
import Link from 'next/link';
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

interface ProfileProps {
  id: string;
  district: string;
  bloodGroup: string;
  college: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function StatsPage() {
  const [profiles, setProfiles] = useState<ProfileProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Directory</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Batch Statistics</h1>
          <p className="mt-2 text-zinc-400">Overview of DjMC Batch 35 demographics.</p>
        </div>

        {isLoading ? (
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
      </main>
    </div>
  );
}
