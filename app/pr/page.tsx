'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { Loader2, CheckCircle2, BarChart3, AlertCircle, FileText, X, Upload } from 'lucide-react';
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
  created_at: string;
}

interface Vote {
  option_id: string;
  user_id: string;
}

interface InfoRequestField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'image';
  label: string;
  required: boolean;
  options?: string[];
  target_column: string;
}

interface InfoRequest {
  id: string;
  title: string;
  description: string;
  fields: InfoRequestField[];
  is_published: boolean;
  is_open: boolean;
  created_at: string;
}

export default function PRPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
  const [votes, setVotes] = useState<Record<string, Vote[]>>({}); // poll_id -> votes
  const [userVote, setUserVote] = useState<Record<string, string>>({}); // poll_id -> option_id
  const [submittedRequests, setSubmittedRequests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Info Request Modal State
  const [selectedRequest, setSelectedRequest] = useState<InfoRequest | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Fetch published polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (pollsError) {
        console.error('Error fetching polls:', pollsError);
      } else {
        setPolls(pollsData || []);
      }

      // Fetch published info requests
      const { data: infoRequestsData, error: infoRequestsError } = await supabase
        .from('info_requests')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (infoRequestsError) {
        console.error('Error fetching info requests:', infoRequestsError);
      } else {
        setInfoRequests(infoRequestsData || []);
      }

      if (!session) {
        setIsLoading(false);
        return;
      }

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
            if (!votesMap[vote.poll_id]) {
              votesMap[vote.poll_id] = [];
            }
            votesMap[vote.poll_id].push(vote);

            if (vote.user_id === session.user.id) {
              userVoteMap[vote.poll_id] = vote.option_id;
            }
          });

          setVotes(votesMap);
          setUserVote(userVoteMap);
        }
      }

      // Fetch user's submitted info requests
      if (infoRequestsData && infoRequestsData.length > 0) {
        const requestIds = infoRequestsData.map(r => r.id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('collected_info')
          .select('request_id')
          .eq('user_id', session.user.id)
          .in('request_id', requestIds);

        if (!submissionsError && submissionsData) {
          const submittedSet = new Set(submissionsData.map(s => s.request_id));
          setSubmittedRequests(submittedSet);
        }
      }

      setIsLoading(false);
    }

    fetchData();
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return;
    setSubmitting(pollId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/polls/vote', {
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

      // Update local state
      setUserVote(prev => ({ ...prev, [pollId]: optionId }));
      
      // Update votes count
      setVotes(prev => {
        const pollVotes = prev[pollId] || [];
        // Remove previous vote if exists
        const filteredVotes = pollVotes.filter(v => v.user_id !== user.id);
        return {
          ...prev,
          [pollId]: [...filteredVotes, { option_id: optionId, user_id: user.id }]
        };
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(null);
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

  const openInfoRequest = async (request: InfoRequest) => {
    if (!user) {
      alert("Please sign in to submit information.");
      return;
    }
    setSelectedRequest(request);
    setInfoError('');
    setInfoSuccess(false);
    setFormData({});

    // If already submitted, fetch existing data to pre-fill
    if (submittedRequests.has(request.id)) {
      const { data, error } = await supabase
        .from('collected_info')
        .select('*')
        .eq('request_id', request.id)
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        const initialData: Record<string, any> = {};
        request.fields.forEach(field => {
          if (data[field.target_column] !== undefined && data[field.target_column] !== null) {
            initialData[field.id] = data[field.target_column];
          }
        });
        setFormData(initialData);
      }
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !user) return;

    setIsSubmittingInfo(true);
    setInfoError('');
    setInfoSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Prepare data payload
      const payloadData: Record<string, any> = {};
      selectedRequest.fields.forEach(field => {
        if (formData[field.id] !== undefined) {
          payloadData[field.target_column] = formData[field.id];
        }
      });

      const res = await fetch('/api/pr/submit-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          data: payloadData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit information');
      }

      setInfoSuccess(true);
      setSubmittedRequests(prev => new Set(prev).add(selectedRequest.id));
      setTimeout(() => {
        setSelectedRequest(null);
      }, 2000);
    } catch (error: any) {
      setInfoError(error.message);
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `info-requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery') // Reuse gallery bucket or create a new one. Assuming gallery exists and is public.
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [fieldId]: publicUrl }));
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4 flex items-center justify-center md:justify-start gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            Polls & Requests
          </h1>
          <p className="text-lg text-zinc-400">
            Vote on important batch decisions and submit requested information.
          </p>
        </div>

        {!user && (
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 text-center mb-12">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
            <p className="text-zinc-400 mb-6">You need to be signed in to view and interact with polls and requests.</p>
            <Link href="/" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
              Go to Home
            </Link>
          </div>
        )}

        {/* Info Requests Section */}
        {user && infoRequests.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-emerald-400" />
              Information Requests
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {infoRequests.map(request => {
                const isSubmitted = submittedRequests.has(request.id);
                return (
                  <button
                    key={request.id}
                    onClick={() => openInfoRequest(request)}
                    className={`text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col h-full ${
                      isSubmitted 
                        ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50' 
                        : 'bg-zinc-900/50 border-white/10 hover:border-white/20 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white line-clamp-1">{request.title}</h3>
                      {isSubmitted && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{request.description}</p>
                    <div className="mt-auto">
                      {!request.is_open ? (
                        <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-md">Closed</span>
                      ) : isSubmitted ? (
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Submitted (Click to Edit)</span>
                      ) : (
                        <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">Action Required</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Polls Section */}
        {user && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-400" />
              Active Polls
            </h2>
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
                              {/* Vote Button / Result Bar */}
                              <button
                                onClick={() => handleVote(poll.id, opt.id)}
                                disabled={!poll.is_open || submitting === poll.id}
                                className={`w-full relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-white/10 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800'
                                } ${!poll.is_open ? 'cursor-default opacity-80' : ''}`}
                              >
                                {/* Progress Bar Background (only show if voted or closed) */}
                                {(hasVoted || !poll.is_open) && (
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
                                  
                                  {(hasVoted || !poll.is_open) && (
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
          </div>
        )}
      </main>

      {/* Info Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">{selectedRequest.title}</h2>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-zinc-400 mb-6">{selectedRequest.description}</p>
              
              {infoSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-emerald-400 mb-1">Successfully Submitted!</h3>
                  <p className="text-emerald-500/80 text-sm">Your information has been recorded.</p>
                </div>
              ) : (
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                  {selectedRequest.fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          required={field.required}
                          value={formData[field.id] || ''}
                          onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!selectedRequest.is_open}
                        />
                      )}
                      
                      {field.type === 'number' && (
                        <input
                          type="number"
                          required={field.required}
                          value={formData[field.id] || ''}
                          onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!selectedRequest.is_open}
                        />
                      )}
                      
                      {field.type === 'date' && (
                        <input
                          type="date"
                          required={field.required}
                          value={formData[field.id] || ''}
                          onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!selectedRequest.is_open}
                        />
                      )}
                      
                      {field.type === 'select' && (
                        <select
                          required={field.required}
                          value={formData[field.id] || ''}
                          onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!selectedRequest.is_open}
                        >
                          <option value="">Select an option</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'image' && (
                        <div>
                          <div className="flex items-center gap-4">
                            <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors ${!selectedRequest.is_open ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="h-4 w-4" />
                              <span className="text-sm font-medium">Upload Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, field.id)}
                                disabled={!selectedRequest.is_open}
                              />
                            </label>
                            {formData[field.id] && (
                              <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Uploaded
                              </span>
                            )}
                          </div>
                          {formData[field.id] && (
                            <div className="mt-3 relative w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                              <img src={formData[field.id]} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {infoError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {infoError}
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmittingInfo || !selectedRequest.is_open}
                      className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmittingInfo ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
                      ) : !selectedRequest.is_open ? (
                        'Request Closed'
                      ) : (
                        'Submit Information'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

