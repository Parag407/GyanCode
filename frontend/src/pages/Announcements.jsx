import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Megaphone, Calendar, User, Trash2, Send, Loader2, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Announcements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        const token = session.access_token;
        try {
          const [profRes, annRes] = await Promise.all([
            fetch(import.meta.env.VITE_API_URL + '/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(import.meta.env.VITE_API_URL + '/announcements', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          if (isMounted) {
            if (profRes.ok) setProfile(await profRes.json());
            if (annRes.ok) setAnnouncements(await annRes.json());
          }
        } catch (err) {
          console.error("Announcements Fetch Error:", err);
        }
      }
      if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handlePost = async () => {
    if (!form.title.trim()) return;
    setPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(import.meta.env.VITE_API_URL + '/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const ann = await res.json();
      setAnnouncements([ann, ...announcements]);
      setForm({ title: '', body: '' });
    }
    setPosting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  if (loading && announcements.length === 0) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

  return (
    <div className={`max-w-4xl mx-auto space-y-8 animate-fade-in-up ${loading ? 'opacity-60 transition-opacity' : ''}`}>
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 justify-end">
             Announcements <Megaphone size={28} className="text-primary-light" />
          </h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated with the latest from CyanCode</p>
        </div>
      </div>

      {profile?.role === 'Educator' && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 border-primary/20 bg-primary/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Send size={18} className="text-primary-light" /> Post New Announcement
          </h3>
          <div className="space-y-4">
            <input 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Announcement Title"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-white/[0.07] transition-all"
            />
            <textarea 
              value={form.body} 
              onChange={e => setForm({...form, body: e.target.value})}
              placeholder="Announcement details..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-white/[0.07] transition-all resize-none"
            />
            <button 
              onClick={handlePost} 
              disabled={posting || !form.title.trim()}
              className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {posting ? <Loader2 size={18} className="animate-spin" /> : <><Bell size={18} /> Broadcast Now</>}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="glass-card rounded-2xl p-4 sm:p-6 relative group animate-fade-in">
            {profile?.role === 'Educator' && (
              <button 
                onClick={() => handleDelete(ann.id)}
                className="absolute top-6 right-6 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                <Megaphone size={24} className="text-primary-light" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{ann.title}</h3>
                <p className="text-gray-400 leading-relaxed">{ann.body}</p>
                <div className="flex items-center gap-4 pt-2">
                   <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                     <Calendar size={12} /> {new Date(ann.created_at).toLocaleDateString()}
                   </span>
                   <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                     <User size={12} /> {ann.users?.name || 'GyanCode Staff'}
                   </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="py-20 text-center glass-card rounded-3xl opacity-50">
            <Megaphone size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No announcements yet. Keep an eye out!</p>
          </div>
        )}
      </div>
    </div>
  );
}
