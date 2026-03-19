'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Loader2, CheckCircle2, AlertCircle, Edit2, X, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<'whatsapp' | 'facebook' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hscBatch: '',
    college: '',
    bloodGroup: '',
    admissionRoll: '',
    district: '',
    whatsapp: '',
    facebook: '',
  });

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUser(session.user);
      
      // Fetch profile from API route
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${currentSession?.access_token}`
        }
      });
      
      if (res.ok) {
        const { profile: studentData } = await res.json();
        if (studentData) {
          setProfile(studentData);
          setFormData({
            name: studentData.name || session.user.user_metadata.full_name,
            email: studentData.email || session.user.email,
            phone: studentData.phone || '',
            hscBatch: studentData.hsc_batch || '',
            college: studentData.college || '',
            bloodGroup: studentData.blood_group || '',
            admissionRoll: studentData.admission_roll || '',
            district: studentData.district || '',
            whatsapp: studentData.whatsapp || '',
            facebook: studentData.facebook || '',
          });
        } else {
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata.full_name || '',
            email: session.user.email || '',
          }));
        }
      }
      setIsLoading(false);
    }
    fetchUser();
  }, [router]);

  const handlePhoneCheck = async () => {
    if (!formData.phone) return;
    setIsLoading(true);
    
    // Check if phone exists via API
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/profile/check-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ phone: formData.phone })
    });

    const { data } = await res.json();

    if (data && !data.user_id) {
      // Autofill data
      setFormData(prev => ({
        ...prev,
        hscBatch: data.hsc_batch || '',
        college: data.college || '',
        bloodGroup: data.blood_group || '',
        admissionRoll: data.admission_roll || '',
        district: data.district || '',
        whatsapp: data.whatsapp || '',
        facebook: data.facebook || '',
      }));
      setMessage({ type: 'success', text: 'Phone number found! Autofilled your information.' });
    } else if (data && data.user_id) {
      setMessage({ type: 'error', text: 'This phone number is already linked to another account.' });
    } else {
      setMessage({ type: 'error', text: 'Phone number not found in database. You will need admin approval.' });
    }
    setIsLoading(false);
  };

  const handleInlineSave = async (field: 'whatsapp' | 'facebook') => {
    setIsSaving(true);
    setMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hscBatch: formData.hscBatch,
        college: formData.college,
        bloodGroup: formData.bloodGroup,
        admissionRoll: formData.admissionRoll,
        district: formData.district,
        whatsapp: field === 'whatsapp' ? formData.whatsapp : profile?.whatsapp,
        facebook: field === 'facebook' ? formData.facebook : profile?.facebook,
        photo_url: profile ? profile.photo_url : user.user_metadata.avatar_url,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update');
      }

      // Refresh profile state
      const profileRes = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (profileRes.ok) {
        const { profile: updatedProfile } = await profileRes.json();
        setProfile(updatedProfile);
      }

      setEditingField(null);
      setMessage({ type: 'success', text: 'Updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hscBatch: formData.hscBatch,
        college: formData.college,
        bloodGroup: formData.bloodGroup,
        admissionRoll: formData.admissionRoll,
        district: formData.district,
        whatsapp: formData.whatsapp,
        facebook: formData.facebook,
        photo_url: profile ? profile.photo_url : user.user_metadata.avatar_url,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      // Refresh profile state
      const profileRes = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (profileRes.ok) {
        const { profile: updatedProfile } = await profileRes.json();
        setProfile(updatedProfile);
      }

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="mb-8 flex items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user?.user_metadata.avatar_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-zinc-800 shadow-xl" />
          <div>
            <h1 className="text-3xl font-bold text-white">{formData.name}</h1>
            <p className="text-zinc-400">{formData.email}</p>
            {profile && profile.is_approved ? (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                <AlertCircle className="h-3 w-3" /> Pending Approval
              </span>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {profile ? (
          <div className="space-y-8">
            <div className="bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Full Name</label>
                  <div className="text-white font-medium">{profile.name || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Phone Number</label>
                  <div className="text-white font-medium">{profile.phone || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">HSC Batch</label>
                  <div className="text-white font-medium">{profile.hsc_batch || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Previous College</label>
                  <div className="text-white font-medium">{profile.college || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Blood Group</label>
                  <div className="text-white font-medium">{profile.blood_group || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">MAT Roll</label>
                  <div className="text-white font-medium">{profile.admission_roll || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Home District</label>
                  <div className="text-white font-medium">{profile.district || <span className="text-zinc-600 italic">Not provided</span>}</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">Social Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-2">WhatsApp Number</label>
                  {editingField === 'whatsapp' ? (
                    <div className="flex gap-2">
                      <input 
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                        className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-2 px-3 text-white focus:border-white/20 focus:outline-none"
                      />
                      <button onClick={() => handleInlineSave('whatsapp')} disabled={isSaving} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                      <button onClick={() => {
                        setFormData({...formData, whatsapp: profile.whatsapp || ''});
                        setEditingField(null);
                      }} disabled={isSaving} className="p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-zinc-900/30 py-3 px-4 rounded-xl border border-white/5 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="text-white truncate">{profile.whatsapp || <span className="text-zinc-600 italic">Not provided</span>}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setFormData({...formData, whatsapp: profile.whatsapp || ''});
                          setEditingField('whatsapp');
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg"
                        title="Edit WhatsApp"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-2">Facebook Profile Link</label>
                  {editingField === 'facebook' ? (
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                        className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-2 px-3 text-white focus:border-white/20 focus:outline-none"
                      />
                      <button onClick={() => handleInlineSave('facebook')} disabled={isSaving} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                      <button onClick={() => {
                        setFormData({...formData, facebook: profile.facebook || ''});
                        setEditingField(null);
                      }} disabled={isSaving} className="p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-zinc-900/30 py-3 px-4 rounded-xl border border-white/5 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="text-white truncate">{profile.facebook || <span className="text-zinc-600 italic">Not provided</span>}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setFormData({...formData, facebook: profile.facebook || ''});
                          setEditingField('facebook');
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg"
                        title="Edit Facebook"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="text"
                  value={formData.name}
                  readOnly
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  readOnly
                  placeholder="Admin will set this"
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">HSC Batch <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="text"
                  value={formData.hscBatch}
                  readOnly
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Previous College <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="text"
                  value={formData.college}
                  readOnly
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Blood Group <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="text"
                  value={formData.bloodGroup}
                  readOnly
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">MAT Roll <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="text"
                  value={formData.admissionRoll}
                  readOnly
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Home District <span className="text-xs text-zinc-500">(Admin only)</span></label>
                <input
                  type="text"
                  value={formData.district}
                  readOnly
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-3 px-4 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Facebook Profile Link</label>
                <input
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
