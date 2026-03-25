'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { Loader2, CheckCircle2, BarChart3, AlertCircle, FileText, Upload } from 'lucide-react';
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

interface InfoRequest {
  id: string;
  title: string;
  description: string;
  fields: { name: string; type: string }[];
  is_active: boolean;
  created_at: string;
}

export default function PRPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
  const [votes, setVotes] = useState<Record<string, Vote[]>>({}); // poll_id -> votes
  const [userVote, setUserVote] = useState<Record<string, string>>({}); // poll_id -> option_id
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [infoFormData, setInfoFormData] = useState<Record<string, any>>({});
  const [submittedInfo, setSubmittedInfo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchPolls() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session) {
        setIsLoading(false);
        return;
      }

      // Fetch published polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!pollsError && pollsData) {
        setPolls(pollsData);
      }

      // Fetch active info requests
      try {
        const res = await fetch('/api/pr/info-requests');
        if (res.ok) {
          const data = await res.json();
          setInfoRequests(data.infoRequests || []);
        }
      } catch (err) {
        console.error('Error fetching info requests:', err);
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

      setIsLoading(false);
    }

    fetchPolls();
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

  const handleInfoSubmit = async (e: React.FormEvent, request: InfoRequest) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(request.id);

    try {
      const dataToSubmit = infoFormData[request.id] || {};
      
      const res = await fetch('/api/pr/submit-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: request.id,
          request_title: request.title,
          user_id: user.id,
          data: dataToSubmit,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit info');
      }

      setSubmittedInfo(prev => ({ ...prev, [request.id]: true }));
      alert('Information submitted successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleInfoFieldChange = (requestId: string, fieldName: string, value: any) => {
    setInfoFormData(prev => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [fieldName]: value
      }
    }));
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
            Batch PR
          </h1>
          <p className="text-lg text-zinc-400">
            Vote on important batch decisions and submit requested information.
          </p>
        </div>

        {!user ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
            <p className="text-zinc-400 mb-6">You need to be signed in to view and vote on polls.</p>
            <Link href="/" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
              Go to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Info Requests Section */}
            {infoRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-orange-400" />
                  Information Requests
                </h2>
                <div className="grid gap-6">
                  {infoRequests.map(request => (
                    <div key={request.id} className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 sm:p-8">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{request.title}</h3>
                        {request.description && <p className="text-zinc-400">{request.description}</p>}
                      </div>

                      {submittedInfo[request.id] ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                          <h4 className="text-lg font-bold text-white">Submitted Successfully</h4>
                          <p className="text-zinc-400 text-sm">Thank you for providing the requested information.</p>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleInfoSubmit(e, request)} className="space-y-4">
                          {request.fields.map((field, idx) => (
                            <div key={idx}>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">{field.name}</label>
                              {field.type === 'text' && (
                                <input
                                  type="text"
                                  required
                                  onChange={(e) => handleInfoFieldChange(request.id, field.name, e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                              )}
                              {field.type === 'number' && (
                                <input
                                  type="number"
                                  required
                                  onChange={(e) => handleInfoFieldChange(request.id, field.name, e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                              )}
                              {field.type === 'image' && (
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        if (file.size > 1024 * 1024) {
                                          alert('Image must be smaller than 1MB');
                                          e.target.value = '';
                                          return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          handleInfoFieldChange(request.id, field.name, reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="pt-4">
                            <button
                              type="submit"
                              disabled={submitting === request.id}
                              className="w-full rounded-xl bg-white py-3 font-bold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {submitting === request.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                              Submit Information
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Polls Section */}
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
    </div>
  )}
</main>
</div>
);
}
