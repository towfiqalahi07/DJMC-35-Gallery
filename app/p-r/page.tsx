'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, BarChart3, AlertCircle, Plus, X, ChevronRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  is_published: boolean;
  is_open: boolean;
  show_results: boolean;
  created_at: string;
}

interface InfoRequest {
  id: string;
  title: string;
  description: string;
  field_type: 'text' | 'number' | 'image' | 'select';
  target_column: string;
  options?: string[];
  is_active: boolean;
  placeholder?: string;
}

interface Vote {
  option_id: string;
  user_id: string;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
  const [collectedInfo, setCollectedInfo] = useState<any>(null);
  const [votes, setVotes] = useState<Record<string, Vote[]>>({}); // poll_id -> votes
  const [userVote, setUserVote] = useState<Record<string, string>>({}); // poll_id -> option_id
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'pending_approval' | 'approved'>('loading');
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<InfoRequest | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
    class_roll: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session) {
        setAuthStatus('unauthenticated');
        setIsLoading(false);
        return;
      }

      // Fetch user's profile to check approval status
      const { data: profileData, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!profileData) {
        router.push('/profile');
        return;
      }

      setProfile(profileData);
      setProfileFormData({
        name: profileData.name || session.user.user_metadata?.full_name || '',
        phone: profileData.phone || '',
        class_roll: profileData.class_roll || ''
      });

      if (!profileData.is_approved) {
        setAuthStatus('pending_approval');
        setIsLoading(false);
        return;
      }

      setAuthStatus('approved');

      // Fetch published polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!pollsError) setPolls(pollsData || []);

      // Fetch active info requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('info_requests')
        .select('*')
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false });

      if (!requestsError) setInfoRequests(requestsData || []);

      // Fetch user's collected info
      const { data: infoData, error: infoError } = await supabase
        .from('collected_info')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!infoError) setCollectedInfo(infoData);

      // Fetch votes for these polls
      if (pollsData && pollsData.length > 0) {
        const pollIds = pollsData.map(p => p.id);
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .in('poll_id', pollIds);

        if (!votesError && votesData) {
          const votesMap: Record<string, Vote[]> = {};
          const userVoteMap: Record<string, string> = {};

          votesData.forEach(vote => {
            if (!votesMap[vote.poll_id]) votesMap[vote.poll_id] = [];
            votesMap[vote.poll_id].push(vote);
            if (vote.user_id === session.user.id) userVoteMap[vote.poll_id] = vote.option_id;
          });

          setVotes(votesMap);
          setUserVote(userVoteMap);
        }
      }

      setIsLoading(false);
    }

    fetchData();
  }, [router]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user || authStatus !== 'approved') return;
    setSubmitting(pollId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/p-r/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to vote');
      }

      setUserVote(prev => ({ ...prev, [pollId]: optionId }));
      
      setVotes(prev => {
        const pollVotes = prev[pollId] || [];
        const filteredVotes = pollVotes.filter(v => v.user_id !== user.id);
        return {
          ...prev,
          [pollId]: [...filteredVotes, { option_id: optionId, user_id: user.id }]
        };
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(null);
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRequest || authStatus !== 'approved') return;
    setSubmitting(activeRequest.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let finalValue = inputValue;

      if (activeRequest.field_type === 'image' && selectedFile) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            filename: selectedFile.name,
            contentType: selectedFile.type,
          }),
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || 'Failed to get upload URL');
        }

        const { signedUrl, publicUrl } = await uploadRes.json();

        const s3Res = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': selectedFile.type,
          },
          body: selectedFile,
        });

        if (!s3Res.ok) throw new Error('Failed to upload image');

        finalValue = publicUrl;
      }

      const res = await fetch('/api/p-r/info-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          request_id: activeRequest.id, 
          value: finalValue,
          target_column: activeRequest.target_column
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit info');
      }

      setCollectedInfo((prev: any) => ({
        ...prev,
        [activeRequest.target_column]: finalValue
      }));
      
      setActiveRequest(null);
      setInputValue('');
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Information submitted successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(null);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: profileFormData.name,
          phone: profileFormData.phone,
          classRoll: profileFormData.class_roll,
          email: profile?.email || session.user.email,
          hscBatch: profile?.hsc_batch,
          college: profile?.college,
          bloodGroup: profile?.blood_group,
          admissionRoll: profile?.admission_roll,
          district: profile?.district,
          whatsapp: profile?.whatsapp,
          facebook: profile?.facebook,
          photo_url: profile?.photo_url,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      setProfile((prev: any) => ({
        ...prev,
        name: profileFormData.name,
        phone: profileFormData.phone,
        class_roll: profileFormData.class_roll
      }));
      
      setShowProfileForm(false);
      setMessage({ type: 'success', text: 'Profile updated successfully! You can now submit your info.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const calculateResults = (pollId: string, options: PollOption[]) => {
    const pollVotes = votes[pollId] || [];
    const totalVotes = pollVotes.length;
    
    return options.map(opt => {
      const count = pollVotes.filter(v => v.option_id === opt.id).length;
      const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      return { ...opt, count, percentage };
    });
  };

  if (isLoading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
              ? 'You must be signed in to participate in polls and submit info requests.' 
              : 'Your profile is currently under review by the admins. You will be able to vote and submit info once your profile is verified and approved.'}
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

  return (
    <>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {message && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4 flex items-center justify-center md:justify-start gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            Batch P&R
          </h1>
          <p className="text-lg text-zinc-400">
            Vote on important batch decisions and submit necessary information.
          </p>
        </div>

        <div className="space-y-12">
          {/* Info Requests Section */}
          {infoRequests.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-blue-500 rounded-full" />
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">Info Requests</h2>
                </div>
                {infoRequests.length > 3 && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                    Scroll for more <ChevronRight className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                {infoRequests.map((request) => {
                  const value = collectedInfo?.[request.target_column];
                  const isSubmitted = value !== undefined && value !== null && value !== '';
                  
                  return (
                    <button
                      key={request.id}
                      onClick={() => {
                        // Failsafe check for profile completion
                        if (!profile?.name || !profile?.phone || !profile?.class_roll) {
                          setShowProfileForm(true);
                          return;
                        }
                        setActiveRequest(request);
                        setInputValue(value || '');
                        setSelectedFile(null);
                      }}
                      className={`flex-none w-[280px] group relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-500 text-left ${
                        isSubmitted 
                          ? 'bg-zinc-900/40 border-emerald-500/20 hover:border-emerald-500/40' 
                          : 'bg-zinc-900/80 border-white/5 hover:border-blue-500/30 hover:bg-zinc-900 shadow-xl shadow-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-4">
                        <div className={`p-2 rounded-xl ${isSubmitted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} group-hover:scale-110 transition-transform duration-500`}>
                          {isSubmitted ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </div>
                        {isSubmitted ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 bg-emerald-500/5 px-2 py-1 rounded-md">Submitted</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/70 bg-blue-500/5 px-2 py-1 rounded-md">Pending</span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{request.title}</h3>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{request.description}</p>
                      
                      <div className="mt-auto w-full pt-3 border-t border-white/5 flex items-center justify-between">
                        {isSubmitted ? (
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">Your Entry</p>
                            <p className="text-xs text-zinc-400 truncate font-mono">{value}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                            Complete now <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Polls Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-8 bg-amber-500 rounded-full" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Active Polls</h2>
            </div>
            {polls.length === 0 ? (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-12 text-center">
                <BarChart3 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No active polls</h2>
                <p className="text-zinc-500">There are currently no published polls to vote on.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {polls.map(poll => {
                  const results = calculateResults(poll.id, poll.options);
                  const totalVotes = votes[poll.id]?.length || 0;
                  const hasVoted = !!userVote[poll.id];

                  return (
                    <div key={poll.id} className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-2">{poll.title}</h2>
                          {poll.description && <p className="text-zinc-400">{poll.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          {!poll.is_open && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              Closed
                            </span>
                          )}
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/5">
                            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {results.map(opt => {
                          const isSelected = userVote[poll.id] === opt.id;
                          
                          return (
                            <div key={opt.id} className="relative">
                              <button
                                onClick={() => handleVote(poll.id, opt.id)}
                                disabled={!poll.is_open || submitting === poll.id}
                                className={`w-full relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-white/10 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800'
                                } ${!poll.is_open ? 'cursor-default opacity-80' : ''}`}
                              >
                                {(hasVoted || !poll.is_open) && poll.show_results && (
                                  <div 
                                    className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-blue-500/20' : 'bg-white/5'} transition-all duration-1000 ease-out`}
                                    style={{ width: `${opt.percentage}%` }}
                                  />
                                )}
                                
                                <div className="relative z-10 flex items-center justify-between p-4 sm:p-5">
                                  <div className="flex items-center gap-3">
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
                                    }`}>
                                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                    </div>
                                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                      {opt.text}
                                    </span>
                                  </div>
                                  
                                  {(hasVoted || !poll.is_open) && poll.show_results && (
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-zinc-500">{opt.count} votes</span>
                                      <span className={`font-bold ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`}>
                                        {opt.percentage}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      {submitting === poll.id && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting vote...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Info Request Submission Modal */}
        {activeRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">{activeRequest.title}</h2>
              <p className="text-zinc-400 mb-6">{activeRequest.description}</p>
              
              <form onSubmit={handleInfoSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-2 uppercase tracking-widest">
                    {activeRequest.title}
                  </label>
                  {activeRequest.field_type === 'select' ? (
                    <select
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select an option</option>
                      {activeRequest.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : activeRequest.field_type === 'image' ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                      required
                    />
                  ) : (
                    <input
                      type={activeRequest.field_type === 'number' ? 'number' : 'text'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={activeRequest.placeholder || `Enter ${activeRequest.title.toLowerCase()}...`}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRequest(null);
                      setSelectedFile(null);
                      setInputValue('');
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting === activeRequest.id}
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting === activeRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Profile Completion Modal */}
        {showProfileForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
              <p className="text-zinc-400 mb-6">Please provide your basic information before submitting info requests.</p>
              
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Class Roll</label>
                  <input
                    type="text"
                    value={profileFormData.class_roll}
                    onChange={(e) => setProfileFormData({ ...profileFormData, class_roll: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileForm(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
