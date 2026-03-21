import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Pencil, Trash2, Eye, Copy, Download, 
  ArrowLeft, BookOpen, Clock, Trophy, LayoutDashboard, Loader2, Code2
} from 'lucide-react';

export default function MyAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cloning, setCloning] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAssignments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setAssignments(data);
          }
        }
      } catch (err) {
        console.error("Fetch assignments error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAssignments();
    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment permanently?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleClone = async (id) => {
    setCloning(id);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${id}/clone`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
        const cloned = await res.json();
        setAssignments([cloned, ...assignments]);
    }
    setCloning(null);
  };

  const handleExport = async (id, title) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${id}/export`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions_${title.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const filtered = assignments.filter(a => 
    (a.title || '').toLowerCase().includes(search.toLowerCase()) || 
    (a.language || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <BookOpen size={28} className="text-primary-light" /> My Assignments
          </h1>
        </div>
        <Link to="/educator/create-assignment" className="btn-primary px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} /> Create New
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
            placeholder="Search by title or language..." 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(a => (
          <div key={a.id} className="glass-card rounded-2xl p-4 sm:p-6 space-y-5 group hover:border-primary/30 transition-all border-white/5">
            <div className="flex items-start justify-between">
              <div className="bg-primary/10 p-3 rounded-xl">
                 <Code2 size={24} className="text-primary-light" />
              </div>
              <div className="flex gap-1.5">
                 <Link to={`/educator/edit-assignment/${a.id}`} className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all" title="Edit">
                   <Pencil size={15} />
                 </Link>
                 <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Delete">
                   <Trash2 size={15} />
                 </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold truncate">{a.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.language} • {a.proficiency_level}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
               <div className="space-y-0.5 text-left">
                 <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Points</p>
                 <p className="text-sm font-bold flex items-center gap-1.5 text-amber-400">
                    <Trophy size={11} /> {a.points}
                 </p>
               </div>
               <div className="space-y-0.5 text-center px-1">
                 <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Students</p>
                 <p className="text-sm font-bold text-blue-400">
                    {a.unique_students || 0}
                 </p>
               </div>
               <div className="space-y-0.5 text-right">
                 <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Success</p>
                 <p className="text-sm font-bold text-emerald-400">
                    {a.submission_count > 0 ? Math.round((a.success_count / a.submission_count) * 100) : 0}%
                 </p>
               </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
               <Link to={`/educator/assignment/${a.id}`} className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-2">
                 <Eye size={13} /> View Repo
               </Link>
               <button onClick={() => handleClone(a.id)} disabled={cloning === a.id} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                  {cloning === a.id ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
               </button>
               <button onClick={() => handleExport(a.id, a.title)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                  <Download size={13} />
               </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl opacity-50">
            <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No assignments found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
