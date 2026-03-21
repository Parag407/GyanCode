import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileCheck, Search, Filter, CheckCircle2, XCircle, Clock, 
  ArrowRight, ArrowLeft, LayoutDashboard, User, Code2, 
  Calendar, Trash2, ExternalLink 
} from 'lucide-react';

export default function AllSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    let isMounted = true;
    const fetchSubmissions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session) {
          const response = await fetch(import.meta.env.VITE_API_URL + '/submissions/all', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (response.ok) {
             const data = await response.json();
             if (isMounted) setSubmissions(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error("Fetch submissions error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSubmissions();
    return () => { isMounted = false; };
  }, []);

  const filtered = submissions
    .filter(s => {
      const matchSearch = (s.users?.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (s.assignments?.title || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.submitted_at) - new Date(a.submitted_at);
      if (sortBy === 'oldest') return new Date(a.submitted_at) - new Date(b.submitted_at);
      return 0;
    });

  const statusIcon = (status) => {
    if (status === 'Success') return <CheckCircle2 size={16} className="text-emerald-400" />;
    if (status === 'Failed') return <XCircle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-amber-400" />;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <FileCheck size={28} className="text-primary-light" /> All Submissions
          </h1>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-black text-white">{submissions.length}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Entries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:bg-white/[0.07] transition-all"
            placeholder="Search by student name or assignment title..." 
          />
        </div>
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all"
        >
          <option value="All" className="bg-card">All Statuses</option>
          <option value="Success" className="bg-card text-emerald-400">Success</option>
          <option value="Failed" className="bg-card text-red-400">Failed</option>
          <option value="Running" className="bg-card text-amber-400">Running</option>
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Student</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Assignment</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.map((s) => (
                <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center text-xs font-black text-primary-light">
                        {s.users?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary-light transition-colors">{s.users?.name || 'Unknown Student'}</p>
                        <p className="text-[10px] text-gray-600 truncate max-w-[120px]">{s.users?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <p className="text-sm font-semibold text-gray-300">{s.assignments?.title || 'Untitled Assignment'}</p>
                    <p className="text-[10px] text-gray-600">{s.language}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                       {statusIcon(s.status)}
                       <span className={`text-[11px] font-bold ${
                         s.status === 'Success' ? 'text-emerald-400' : s.status === 'Failed' ? 'text-red-400' : 'text-amber-400'
                       }`}>{s.status}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                       <Calendar size={12} />
                       <span className="text-[11px] font-medium">{new Date(s.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <Link 
                      to={`/educator/assignment/${s.assignment_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-xs font-bold text-gray-400 hover:text-primary-light transition-all"
                    >
                      Audit <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <FileCheck size={48} className="mx-auto text-gray-700" />
             <p className="text-gray-500 font-medium">No matching submissions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
