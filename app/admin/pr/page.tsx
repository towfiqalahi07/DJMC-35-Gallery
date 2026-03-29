'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, ShieldAlert, Eye, Download, Search, X } from 'lucide-react';
import Header from '@/components/Header';

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

interface InfoField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'image' | 'select';
  options?: string; // Comma separated for select
  target_column: string;
}

interface InfoRequest {
  id: string;
  title: string;
  description: string;
  fields: InfoField[];
  is_published: boolean;
  is_open: boolean;
  created_at: string;
}

const TARGET_COLUMNS = [
  'col_text_1', 'col_text_2', 'col_text_3', 'col_text_4', 'col_text_5',
  'col_num_1', 'col_num_2',
  'col_date_1',
  'col_img_1', 'col_img_2'
];

export default function AdminPRPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'polls' | 'info'>('polls');
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [pollFormData, setPollFormData] = useState({
    title: '',
    description: '',
    options: [{ id: '1', text: '' }, { id: '2', text: '' }],
    is_published: false,
    is_open: true,
  });

  const [isCreatingInfo, setIsCreatingInfo] = useState(false);
  const [editingInfo, setEditingInfo] = useState<InfoRequest | null>(null);
  const [infoFormData, setInfoFormData] = useState({
    title: '',
    description: '',
    fields: [{ id: '1', label: '', type: 'text' as const, target_column: 'col_text_1', options: '' }],
    is_published: false,
    is_open: true,
  });

  // Submissions State
  const [viewingSubmissions, setViewingSubmissions] = useState<InfoRequest | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const [resPolls, resInfo] = await Promise.all([
        fetch('/api/admin/polls', { headers: { 'x-admin-password': password } }),
        fetch('/api/admin/info-requests', { headers: { 'x-admin-password': password } })
      ]);

      if (!resPolls.ok || !resInfo.ok) {
        throw new Error('Invalid password');
      }

      const dataPolls = await resPolls.json();
      const dataInfo = await resInfo.json();
      
      setPolls(dataPolls.polls || []);
      setInfoRequests(dataInfo.infoRequests || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll Handlers
  const handleAddPollOption = () => {
    setPollFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: Date.now().toString(), text: '' }]
    }));
  };

  const handlePollOptionChange = (id: string, text: string) => {
    setPollFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, text } : opt)
    }));
  };

  const handleRemovePollOption = (id: string) => {
    setPollFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const handlePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const validOptions = pollFormData.options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      alert('A poll must have at least 2 options.');
      setIsLoading(false);
      return;
    }

    try {
      const method = editingPoll ? 'PUT' : 'POST';
      const body = editingPoll 
        ? { id: editingPoll.id, ...pollFormData, options: validOptions }
        : { ...pollFormData, options: validOptions };

      const res = await fetch('/api/admin/polls', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save poll');

      const data = await res.json();
      if (editingPoll) {
        setPolls(polls.map(p => p.id === editingPoll.id ? data.poll : p));
      } else {
        setPolls([data.poll, ...polls]);
      }
      
      setIsCreatingPoll(false);
      setEditingPoll(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Info Request Handlers
  const handleAddInfoField = () => {
    setInfoFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { id: Date.now().toString(), label: '', type: 'text', target_column: 'col_text_1', options: '' }]
    }));
  };

  const handleInfoFieldChange = (id: string, key: keyof InfoField, value: string) => {
    setInfoFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, [key]: value } : f)
    }));
  };

  const handleRemoveInfoField = (id: string) => {
    setInfoFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const validFields = infoFormData.fields.filter(f => f.label.trim() !== '');
    if (validFields.length === 0) {
      alert('An info request must have at least 1 field.');
      setIsLoading(false);
      return;
    }

    try {
      const method = editingInfo ? 'PUT' : 'POST';
      const body = editingInfo 
        ? { id: editingInfo.id, ...infoFormData, fields: validFields }
        : { ...infoFormData, fields: validFields };

      const res = await fetch('/api/admin/info-requests', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save info request');

      const data = await res.json();
      if (editingInfo) {
        setInfoRequests(infoRequests.map(r => r.id === editingInfo.id ? data.infoRequest : r));
      } else {
        setInfoRequests([data.infoRequest, ...infoRequests]);
      }
      
      setIsCreatingInfo(false);
      setEditingInfo(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmissions = async (req: InfoRequest) => {
    setViewingSubmissions(req);
    setIsLoadingSubmissions(true);
    setSearchQuery('');
    
    try {
      const res = await fetch(`/api/admin/info-requests/submissions?request_id=${req.id}`, {
        headers: { 'x-admin-password': password }
      });
      
      if (!res.ok) throw new Error('Failed to fetch submissions');
      
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleExportCSV = () => {
    if (!viewingSubmissions || submissions.length === 0) return;

    // Define headers
    const baseHeaders = ['Name', 'Email', 'Phone', 'Admission Roll', 'Class Roll', 'Submitted At'];
    const dynamicHeaders = viewingSubmissions.fields.map(f => f.label);
    const headers = [...baseHeaders, ...dynamicHeaders];

    // Map data
    const csvRows = submissions.map(sub => {
      const baseData = [
        sub.name || '',
        sub.email || '',
        sub.phone || '',
        sub.admission_roll || '',
        sub.class_roll || '',
        new Date(sub.created_at).toLocaleString()
      ];
      
      const dynamicData = viewingSubmissions.fields.map(f => {
        const val = sub[f.target_column];
        return val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '';
      });

      return [...baseData, ...dynamicData].map(v => `"${v}"`).join(',');
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${viewingSubmissions.title.replace(/\s+/g, '_')}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Search in base fields
    if (
      (sub.name && sub.name.toLowerCase().includes(query)) ||
      (sub.email && sub.email.toLowerCase().includes(query)) ||
      (sub.phone && sub.phone.toLowerCase().includes(query)) ||
      (sub.admission_roll && sub.admission_roll.toLowerCase().includes(query)) ||
      (sub.class_roll && sub.class_roll.toLowerCase().includes(query))
    ) {
      return true;
    }

    // Search in dynamic fields
    if (viewingSubmissions) {
      for (const field of viewingSubmissions.fields) {
        const val = sub[field.target_column];
        if (val && String(val).toLowerCase().includes(query)) {
          return true;
        }
      }
    }

    return false;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access - P&R</h1>
            <p className="text-zinc-400 text-sm">Enter the admin password to manage Polls and Info Requests.</p>
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
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage P&R</h1>
            <p className="text-zinc-400 mt-1">Create and manage Polls and Info Requests.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('polls')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'polls' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Polls
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Info Requests
            </button>
          </div>
        </div>

        {activeTab === 'polls' && (
          <div>
            <div className="flex justify-end mb-6">
              {!isCreatingPoll && (
                <button
                  onClick={() => {
                    setEditingPoll(null);
                    setPollFormData({ title: '', description: '', options: [{ id: '1', text: '' }, { id: '2', text: '' }], is_published: false, is_open: true });
                    setIsCreatingPoll(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm"
                >
                  <Plus className="h-4 w-4" /> Create Poll
                </button>
              )}
            </div>

            {isCreatingPoll ? (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">{editingPoll ? 'Edit Poll' : 'Create New Poll'}</h2>
                <form onSubmit={handlePollSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Poll Title</label>
                    <input type="text" value={pollFormData.title} onChange={(e) => setPollFormData({ ...pollFormData, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description (Optional)</label>
                    <textarea value={pollFormData.description} onChange={(e) => setPollFormData({ ...pollFormData, description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Options</label>
                    <div className="space-y-3">
                      {pollFormData.options.map((opt, index) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input type="text" value={opt.text} onChange={(e) => handlePollOptionChange(opt.id, e.target.value)} placeholder={`Option ${index + 1}`} className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20" required />
                          {pollFormData.options.length > 2 && (
                            <button type="button" onClick={() => handleRemovePollOption(opt.id)} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><Trash2 className="h-5 w-5" /></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={handleAddPollOption} className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"><Plus className="h-4 w-4" /> Add Option</button>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pollFormData.is_published} onChange={(e) => setPollFormData({ ...pollFormData, is_published: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20" />
                      <span className="text-sm font-medium text-white">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pollFormData.is_open} onChange={(e) => setPollFormData({ ...pollFormData, is_open: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20" />
                      <span className="text-sm font-medium text-white">Open for voting</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => { setIsCreatingPoll(false); setEditingPoll(null); }} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Poll'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid gap-4">
                {polls.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl"><p className="text-zinc-500">No polls created yet.</p></div>
                ) : (
                  polls.map((poll) => (
                    <div key={poll.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{poll.title}</h3>
                          {poll.is_published ? <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">Published</span> : <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400">Draft</span>}
                          {poll.is_open ? <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">Open</span> : <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400">Closed</span>}
                        </div>
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{poll.description}</p>
                        <div className="text-sm text-zinc-500">{poll.options.length} options • Created {new Date(poll.created_at).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => {
                        setEditingPoll(poll);
                        setPollFormData({ title: poll.title, description: poll.description || '', options: poll.options, is_published: poll.is_published, is_open: poll.is_open });
                        setIsCreatingPoll(true);
                      }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium text-sm">
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div>
            {viewingSubmissions ? (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <button 
                      onClick={() => setViewingSubmissions(null)}
                      className="text-sm text-zinc-400 hover:text-white mb-2 flex items-center gap-1"
                    >
                      ← Back to Info Requests
                    </button>
                    <h2 className="text-xl font-bold text-white">Submissions: {viewingSubmissions.title}</h2>
                    <p className="text-zinc-500 text-sm">{submissions.length} total submissions</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search submissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-black border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
                      />
                    </div>
                    <button
                      onClick={handleExportCSV}
                      disabled={submissions.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                  </div>
                </div>

                {isLoadingSubmissions ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12 bg-black/30 rounded-xl border border-white/5">
                    <p className="text-zinc-500">No submissions found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm text-zinc-300">
                      <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Roll No</th>
                          {viewingSubmissions.fields.map(f => (
                            <th key={f.id} className="px-4 py-3 font-medium">{f.label}</th>
                          ))}
                          <th className="px-4 py-3 font-medium">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSubmissions.map((sub, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{sub.name}</div>
                              <div className="text-xs text-zinc-500">{sub.email}</div>
                              <div className="text-xs text-zinc-500">{sub.phone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>Class: {sub.class_roll}</div>
                              <div className="text-xs text-zinc-500">Admin: {sub.admission_roll}</div>
                            </td>
                            {viewingSubmissions.fields.map(f => (
                              <td key={f.id} className="px-4 py-3">
                                {f.type === 'image' && sub[f.target_column] ? (
                                  <a href={sub[f.target_column]} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">View Image</a>
                                ) : (
                                  <span className="line-clamp-2">{sub[f.target_column] || '-'}</span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-zinc-500">
                              {new Date(sub.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-6">
                  {!isCreatingInfo && (
                    <button
                      onClick={() => {
                        setEditingInfo(null);
                        setInfoFormData({ title: '', description: '', fields: [{ id: '1', label: '', type: 'text', target_column: 'col_text_1', options: '' }], is_published: false, is_open: true });
                        setIsCreatingInfo(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm"
                    >
                      <Plus className="h-4 w-4" /> Create Info Request
                    </button>
                  )}
                </div>

            {isCreatingInfo ? (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">{editingInfo ? 'Edit Info Request' : 'Create New Info Request'}</h2>
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Request Title</label>
                    <input type="text" value={infoFormData.title} onChange={(e) => setInfoFormData({ ...infoFormData, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description (Optional)</label>
                    <textarea value={infoFormData.description} onChange={(e) => setInfoFormData({ ...infoFormData, description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Fields</label>
                    <div className="space-y-4">
                      {infoFormData.fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex-1 w-full">
                            <input type="text" value={field.label} onChange={(e) => handleInfoFieldChange(field.id, 'label', e.target.value)} placeholder={`Field Label (e.g., T-Shirt Size)`} className="w-full rounded-lg border border-white/10 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-white/20 focus:outline-none" required />
                          </div>
                          <div className="w-full sm:w-32">
                            <select value={field.type} onChange={(e) => handleInfoFieldChange(field.id, 'type', e.target.value)} className="w-full rounded-lg border border-white/10 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-white/20 focus:outline-none">
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="select">Dropdown</option>
                              <option value="image">Image URL</option>
                            </select>
                          </div>
                          {field.type === 'select' && (
                            <div className="w-full sm:flex-1">
                              <input type="text" value={field.options || ''} onChange={(e) => handleInfoFieldChange(field.id, 'options', e.target.value)} placeholder="Options (comma separated)" className="w-full rounded-lg border border-white/10 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-white/20 focus:outline-none" required />
                            </div>
                          )}
                          <div className="w-full sm:w-40">
                            <select value={field.target_column} onChange={(e) => handleInfoFieldChange(field.id, 'target_column', e.target.value)} className="w-full rounded-lg border border-white/10 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-white/20 focus:outline-none">
                              {TARGET_COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                          </div>
                          <button type="button" onClick={() => handleRemoveInfoField(field.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={handleAddInfoField} className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"><Plus className="h-4 w-4" /> Add Field</button>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={infoFormData.is_published} onChange={(e) => setInfoFormData({ ...infoFormData, is_published: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20" />
                      <span className="text-sm font-medium text-white">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={infoFormData.is_open} onChange={(e) => setInfoFormData({ ...infoFormData, is_open: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20" />
                      <span className="text-sm font-medium text-white">Open for submissions</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => { setIsCreatingInfo(false); setEditingInfo(null); }} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Info Request'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid gap-4">
                {infoRequests.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl"><p className="text-zinc-500">No info requests created yet.</p></div>
                ) : (
                  infoRequests.map((req) => (
                    <div key={req.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{req.title}</h3>
                          {req.is_published ? <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">Published</span> : <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400">Draft</span>}
                          {req.is_open ? <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">Open</span> : <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400">Closed</span>}
                        </div>
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{req.description}</p>
                        <div className="text-sm text-zinc-500">{req.fields.length} fields • Created {new Date(req.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewSubmissions(req)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium text-sm border border-blue-500/20">
                          <Eye className="h-4 w-4" /> Submissions
                        </button>
                        <button onClick={() => {
                          setEditingInfo(req);
                          setInfoFormData({ title: req.title, description: req.description || '', fields: req.fields, is_published: req.is_published, is_open: req.is_open });
                          setIsCreatingInfo(true);
                        }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium text-sm">
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            </>
          )}
          </div>
        )}
      </main>
    </div>
  );
}
