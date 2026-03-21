import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Mail, Building2, BookOpen, Save, CheckCircle2, Camera, Trophy, FileCheck, Award, Loader2, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', academic_year: '', department: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ submissions: 0, certificates: 0 });
  const [activeTab, setActiveTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        const [profileRes, subRes, certRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(import.meta.env.VITE_API_URL + '/submissions', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(import.meta.env.VITE_API_URL + '/certificates', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        const profileData = await profileRes.json();
        const subData = await subRes.json();
        const certData = await certRes.json();
        const subs = Array.isArray(subData) ? subData : [];
        const solvedCount = new Set(subs.filter(s => s.status === 'Success').map(s => s.assignment_id)).size;

        setProfile(profileData);
        setForm({ name: profileData.name || '', academic_year: profileData.academic_year || '', department: profileData.department || '' });
        setStats({ 
          submissions: subs.length, 
          solved: solvedCount,
          certificates: Array.isArray(certData) ? certData.length : 0 
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(import.meta.env.VITE_API_URL + '/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setProfile(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword.length < 6) { setPwMsg({ text: 'Password must be at least 6 characters.', type: 'error' }); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg({ text: 'Passwords do not match.', type: 'error' }); return; }
    setPwSaving(true); setPwMsg({ text: '', type: '' });
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(import.meta.env.VITE_API_URL + '/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ newPassword: pwForm.newPassword })
    });
    if (res.ok) {
      setPwMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwForm({ newPassword: '', confirm: '' });
    } else {
      const data = await res.json();
      setPwMsg({ text: data.error || 'Failed to change password.', type: 'error' });
    }
    setPwSaving(false);
  };

  // Soft loading check
  const isDataReady = !loading || profile;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5 w-fit">
        <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
      </button>
      {/* Header Card */}
      {!isDataReady ? (
        <div className="glass-card rounded-2xl p-8 animate-pulse flex flex-col items-center gap-4">
           <div className="w-24 h-24 bg-white/5 rounded-3xl mx-auto"></div>
           <div className="h-6 w-48 bg-white/5 rounded mx-auto"></div>
           <div className="h-4 w-32 bg-white/5 rounded mx-auto"></div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
          <div className="relative z-10 space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-black text-white mx-auto shadow-xl shadow-primary/20">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{profile?.name || 'User'}</h1>
              <p className="text-gray-400 text-sm flex items-center justify-center gap-1.5 mt-1">
                <Mail size={14} className="text-gray-500" /> {profile?.email}
              </p>
              <span className="inline-block mt-2 text-[11px] font-bold bg-primary/15 text-primary-light px-3 py-1 rounded-lg">
                {profile?.role}
              </span>
            </div>
            <div className="flex justify-center gap-4 sm:gap-8 pt-2">
              <div className="text-center">
                <p className="text-xl font-black text-white">{profile?.total_points || 0}</p>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1 justify-center"><Trophy size={10} /> Points</p>
              </div>
              <div className="border-l border-white/10 pl-4 sm:pl-8 text-center">
                <p className="text-xl font-black text-white">{stats.solved || 0}</p>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 justify-center"><CheckCircle2 size={10} /> Solved</p>
              </div>
              <div className="border-l border-white/10 pl-4 sm:pl-8 text-center">
                <p className="text-xl font-black text-white">{stats.submissions}</p>
                <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider flex items-center gap-1 justify-center"><FileCheck size={10} /> Attempts</p>
              </div>
              <div className="border-l border-white/10 pl-4 sm:pl-8 text-center">
                <p className="text-xl font-black text-white">{stats.certificates}</p>
                <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider flex items-center gap-1 justify-center"><Award size={10} /> Certificates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl w-fit">
        {[
          { key: 'profile', label: 'Edit Profile' },
          { key: 'security', label: 'Security' },
          { key: 'account', label: 'Account Info' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.key ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="glass-card rounded-2xl p-4 sm:p-8 space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold flex items-center gap-2"><User size={18} className="text-primary-light" /> Profile Settings</h3>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><User size={11} /> Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={11} /> Academic Year</label>
                <select value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                  <option value="" className="bg-card">Select</option>
                  {['FY', 'SY', 'TY', 'Final Year'].map(y => <option key={y} value={y} className="bg-card">{y}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={11} /> Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                  <option value="" className="bg-card">Select</option>
                  {['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Other'].map(d =>
                    <option key={d} value={d} className="bg-card">{d}</option>
                  )}
                </select>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all w-fit">
              {saving ? <><Loader2 size={15} className="animate-spin" /> <span className="hidden sm:inline">Saving...</span></> :
                saved ? <><CheckCircle2 size={15} /> <span className="hidden sm:inline">Saved!</span></> :
                <><Save size={15} /> <span className="hidden sm:inline">Save Changes</span></>}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="glass-card rounded-2xl p-4 sm:p-8 space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold flex items-center gap-2"><Mail size={18} className="text-primary-light" /> Account Information</h3>
          <div className="space-y-4">
            {[
              { label: 'Email', value: profile?.email, icon: <Mail size={14} className="text-blue-400" /> },
              { label: 'Role', value: profile?.role, icon: <User size={14} className="text-emerald-400" /> },
              { label: 'Member Since', value: new Date(profile?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: <BookOpen size={14} className="text-amber-400" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl">
                {item.icon}
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-card rounded-2xl p-4 sm:p-8 space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold flex items-center gap-2"><Lock size={18} className="text-primary-light" /> Change Password</h3>
          {pwMsg.text && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${pwMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {pwMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {pwMsg.text}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Lock size={11} /> New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all" placeholder="Min 6 characters" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Lock size={11} /> Confirm Password</label>
              <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all" placeholder="Re-enter password" />
            </div>
            <button onClick={handleChangePassword} disabled={pwSaving}
              className="btn-primary text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all w-fit">
              {pwSaving ? <><Loader2 size={15} className="animate-spin" /> <span className="hidden sm:inline">Updating...</span></> : <><Lock size={15} /> <span className="hidden sm:inline">Update Password</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
