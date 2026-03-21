import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Code2, Trophy, Search, Filter, ArrowRight, Flame, Sparkles, Zap, CheckCircle2, BarChart, Clock, BookOpen, CalendarClock, AlertTriangle, Megaphone, Bookmark, Tag, XCircle, Building2, Target, Swords, Shield, Send } from 'lucide-react';

const LEVELS = [
  { level: 1, min: 0,    max: 99,   label: 'Novice',     color: 'text-gray-400' },
  { level: 2, min: 100,  max: 299,  label: 'Apprentice', color: 'text-emerald-400' },
  { level: 3, min: 300,  max: 599,  label: 'Coder',      color: 'text-blue-400' },
  { level: 4, min: 600,  max: 999,  label: 'Developer',  color: 'text-violet-400' },
  { level: 5, min: 1000, max: 1999, label: 'Engineer',   color: 'text-amber-400' },
  { level: 6, min: 2000, max: Infinity, label: 'Architect', color: 'text-red-400' },
];
function getLevel(pts) { return LEVELS.find(l => pts >= l.min && pts <= l.max) || LEVELS[0]; }

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterTab, setFilterTab] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [announcements, setAnnouncements] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session) {
          const token = session.access_token;
          const [profileRes, assignRes, subRes, annRes, bookRes] = await Promise.all([
            fetch(import.meta.env.VITE_API_URL + '/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(import.meta.env.VITE_API_URL + '/assignments', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(import.meta.env.VITE_API_URL + '/submissions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(import.meta.env.VITE_API_URL + '/announcements', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(import.meta.env.VITE_API_URL + '/bookmarks', { headers: { 'Authorization': `Bearer ${token}` } }),
          ]);

          if (!isMounted) return;

          const [p, a, s, an, b] = await Promise.all([
            profileRes.json(),
            assignRes.json(),
            subRes.json(),
            annRes.json(),
            bookRes.json()
          ]);

          if (isMounted) {
            setProfile(p);
            setAssignments(Array.isArray(a) ? a : []);
            setSubmissions(Array.isArray(s) ? s : []);
            setAnnouncements(Array.isArray(an) ? an : []);
            setBookmarks(Array.isArray(b) ? b : []);
          }
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const languages = ['All', ...new Set(assignments.map(a => a.language))];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const categories = ['All', ...new Set(assignments.map(a => a.category).filter(Boolean))];

  // Correctly derived per-assignment status
  const solvedIds = new Set(submissions.filter(s => s.status === 'Success').map(s => s.assignment_id));
  const attemptedIds = new Set(submissions.map(s => s.assignment_id)); // all that have any submission

  const isSolved    = (assignmentId) => solvedIds.has(assignmentId);
  const isAttempted = (assignmentId) => attemptedIds.has(assignmentId);

  const solvedCount      = solvedIds.size; // unique assignments solved
  const inProgressCount  = [...attemptedIds].filter(id => !solvedIds.has(id)).length; // tried but not yet solved
  const totalSubmissions = submissions.length; // raw submission count (all attempts)
  const totalAssignments = assignments.length;

  const filtered = assignments
    .filter(a => {
      const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || (a.description || '').toLowerCase().includes(search.toLowerCase());
      const matchLang = filterLang === 'All' || a.language === filterLang;
      const matchLevel = filterLevel === 'All' || a.proficiency_level === filterLevel;
      const matchCategory = filterCategory === 'All' || a.category === filterCategory;
      const matchTab = filterTab === 'All' || (filterTab === 'Saved' && bookmarks.includes(a.id)) || (filterTab === 'Solved' && isSolved(a.id)) || (filterTab === 'Unsolved' && !isSolved(a.id));
      return matchSearch && matchLang && matchLevel && matchCategory && matchTab;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'points-high') return b.points - a.points;
      if (sortBy === 'points-low') return a.points - b.points;
      return 0;
    });

  const paginatedAssignments = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const recentActivity = [...submissions]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5);

  const levelIcon = (level) => {
    if (level === 'Beginner') return <Sparkles size={14} className="text-emerald-400" />;
    if (level === 'Intermediate') return <Zap size={14} className="text-amber-400" />;
    return <Flame size={14} className="text-red-400" />;
  };

  const levelColor = (level) => {
    if (level === 'Beginner') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (level === 'Intermediate') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const toggleBookmark = async (assignmentId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(import.meta.env.VITE_API_URL + '/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ assignment_id: assignmentId })
    });
    const data = await res.json();
    setBookmarks(prev => data.bookmarked ? [...prev, assignmentId] : prev.filter(id => id !== assignmentId));
  };

  const deadlineLabel = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    if (dl < now) return { text: 'Expired', expired: true };
    const diff = dl - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return { text: `${days}d ${hours}h left`, expired: false };
    if (hours > 0) return { text: `${hours}h left`, expired: false };
    return { text: 'Due soon', expired: false };
  };

  // Daily challenge = first unsolved assignment
  const dailyChallenge = assignments.find(a => !isSolved(a.id));

  // Soft loading check
  const isDataReady = !loading || profile;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Streak Banner */}
      {solvedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="text-2xl">🔥</div>
          <div className="flex-1">
            <p className="font-bold text-amber-300 text-sm">
              {solvedCount >= 10 ? `${solvedCount} assignments solved — you're on fire!` :
               solvedCount >= 5 ? `${solvedCount} assignments solved — great momentum!` :
               `${solvedCount} assignment${solvedCount > 1 ? 's' : ''} solved — keep it up!`}
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">Every problem you solve makes you a better developer.</p>
          </div>
          <Link to="/student/progress" className="shrink-0 text-xs font-bold text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all">
            View Progress →
          </Link>
        </div>
      )}
      {/* Profile Header */}
      {!isDataReady ? (
        <div className="glass-card rounded-2xl p-8 flex animate-pulse items-center gap-6">
          <div className="w-20 h-20 bg-white/5 rounded-3xl"></div>
          <div className="flex-1 space-y-3">
             <div className="h-4 w-24 bg-white/5 rounded"></div>
             <div className="h-8 w-48 bg-white/5 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white shrink-0 shadow-lg shadow-primary/20">
            {profile?.name?.charAt(0) || '?'}
          </div>
          <div className="relative z-10 flex-1">
            <p className="text-primary-light text-xs font-black uppercase tracking-[0.2em] mb-1">Welcome Back,</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              {profile?.name || 'Student'}
              <Sparkles size={20} className="text-amber-400 animate-pulse" />
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                <Building2 size={13} /> {profile?.department || 'Department'}
              </p>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                <BookOpen size={13} /> {profile?.academic_year || 'Year'}
              </p>
              <Link to="/profile" className="text-primary-light hover:text-white transition-colors text-xs font-bold flex items-center gap-1 ml-2 border-l border-white/10 pl-4">
                Edit Profile <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1 mr-2 mt-4 md:mt-0">
            {(() => { const lvl = getLevel(profile?.total_points || 0); return (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${lvl.color}`}>
                <Shield size={10} /> Lv.{lvl.level} {lvl.label}
              </span>
            ); })()}
          </div>
          <div className="relative z-10 flex flex-wrap justify-center items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 w-full md:w-auto">
            <div className="text-center px-4">
              <p className="text-2xl font-black text-white">{solvedCount}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Solved</p>
            </div>
            <Link to="/student/submissions" className="text-center px-4 border-l border-r border-white/10 hover:bg-white/5 transition-colors cursor-pointer block">
              <p className="text-2xl font-black text-white">{totalSubmissions}</p>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Attempts</p>
            </Link>
            <div className="text-center px-4 border-r border-white/10">
              <p className="text-2xl font-black text-white">{inProgressCount}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">In Progress</p>
            </div>
            <div className="text-center px-4 border-r border-white/10">
              <p className="text-2xl font-black text-white">{totalAssignments}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary/20 to-accent/10 px-5 py-3 rounded-2xl border border-white/10">
              <Trophy size={22} className="text-amber-400" />
              <div className="text-left">
                <p className="text-2xl font-black text-white leading-tight">{profile?.total_points || 0}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Pts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      {(() => {
        const dueSoonCount = assignments.filter(a => {
          if (!a.deadline || isSolved(a.id)) return false;
          const diff = new Date(a.deadline) - new Date();
          return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
        }).length;
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { to: '/student/progress', icon: <BarChart size={18} />, label: 'My Progress', color: 'text-primary-light' },
              { to: '/student/submissions', icon: <Clock size={18} />, label: 'Submissions', color: 'text-violet-400' },
              { to: '/certificates', icon: <BookOpen size={18} />, label: 'Certificates', color: 'text-amber-400' },
              { to: '/ai-tutor', icon: <Sparkles size={18} />, label: 'AI Tutor', color: 'text-emerald-400' },
              { to: '/leaderboard', icon: <Trophy size={18} />, label: dueSoonCount > 0 ? `${dueSoonCount} Due Soon` : 'Leaderboard', color: dueSoonCount > 0 ? 'text-red-400' : 'text-amber-400' },
            ].map((q, i) => (
              <Link key={i} to={q.to} className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-all group">
                <span className={q.color}>{q.icon}</span>
                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">{q.label}</span>
              </Link>
            ))}
          </div>
        );
      })()}



      {/* Tab Filters */}
      <div className="flex flex-wrap gap-1 bg-white/[0.03] p-1 rounded-xl w-fit">
        {['All', 'Saved', 'Solved', 'Unsolved'].map(t => (
          <button key={t} onClick={() => setFilterTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterTab === t ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}>
            {t === 'Saved' && <Bookmark size={11} className="inline mr-1" />}
            {t}
          </button>
        ))}
      </div>

      {/* Search, Filter & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all text-sm" placeholder="Search assignments..." />
        </div>
        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2">
          <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            {languages.map(l => <option key={l} value={l} className="bg-card">{l === 'All' ? '🌐 All Languages' : l}</option>)}
          </select>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            {levels.map(l => <option key={l} value={l} className="bg-card">{l === 'All' ? '📊 All Levels' : l}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            <option value="newest" className="bg-card">🕐 Newest First</option>
            <option value="points-high" className="bg-card">⬆️ Points High→Low</option>
            <option value="points-low" className="bg-card">⬇️ Points Low→High</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            {categories.map(c => <option key={c} value={c} className="bg-card">{c === 'All' ? '🏷️ All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">{filtered.length} assignment{filtered.length !== 1 ? 's' : ''} found</p>
        {(filterLang !== 'All' || filterLevel !== 'All' || filterCategory !== 'All' || filterTab !== 'All' || search) && (
          <button onClick={() => { setFilterLang('All'); setFilterLevel('All'); setFilterCategory('All'); setFilterTab('All'); setSearch(''); }}
            className="text-xs text-primary-light hover:underline font-medium">Clear filters</button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        {/* Left: Assignments List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {!isDataReady ? (
               [...Array(4)].map((_, i) => (
                 <div key={i} className="glass-card rounded-2xl p-6 h-48 animate-pulse bg-white/5"></div>
               ))
            ) : (
              paginatedAssignments.map(a => {
                const solved = isSolved(a.id);
                const attempted = isAttempted(a.id);
                return (
                  <div key={a.id} className={`glass-card rounded-2xl p-4 sm:p-6 space-y-4 group hover:-translate-y-1 transition-all duration-300 relative ${solved ? 'border-emerald-500/20' : ''}`}>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(a.id); }}
                        className={`p-1.5 rounded-lg transition-all ${bookmarks.includes(a.id) ? 'text-amber-400 bg-amber-500/10' : 'text-gray-600 hover:text-amber-400 hover:bg-amber-500/10'}`}>
                        <Bookmark size={14} fill={bookmarks.includes(a.id) ? 'currentColor' : 'none'} />
                      </button>
                      {solved && <CheckCircle2 size={18} className="text-emerald-400" />}
                      {attempted && !solved && <Clock size={16} className="text-amber-400" />}
                    </div>
                    <div className="flex items-start justify-between">
                        <div className="bg-gradient-to-br from-primary/15 to-accent/5 w-11 h-11 rounded-xl flex items-center justify-center">
                          <Code2 size={20} className="text-primary-light" />
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${levelColor(a.proficiency_level)}`}>
                          {levelIcon(a.proficiency_level)} {a.proficiency_level}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-primary-light transition-colors">{a.title}</h3>
                        <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">{a.description || 'No description provided.'}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                        <span className="text-[11px] font-semibold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg">{a.language}</span>
                        <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg">{a.points} pts</span>
                        {a.category && <span className="text-[10px] font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-lg flex items-center gap-1"><Tag size={8} /> {a.category}</span>}
                      </div>
                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link to={`/student/assignmentdetail/${a.id}`}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                          <ArrowRight size={12} /> View Details
                        </Link>
                        <Link to={`/student/workspace/${a.id}`}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold btn-primary text-white transition-all shadow-lg shadow-primary/20">
                          <Send size={12} /> Submit
                        </Link>
                      </div>
                  </div>
                );
              })
            )}
          </div>

          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl p-16 text-center space-y-4">
              <Code2 size={48} className="text-gray-600 mx-auto" />
              <h3 className="text-lg font-bold text-gray-500">No assignments found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white transition-all disabled:opacity-30">Previous</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white transition-all disabled:opacity-30">Next</button>
            </div>
          )}
        </div>

        {/* Right: Activity & Sidebar */}
        <div className="space-y-6">
          {/* Due Soon Widget */}
          {(() => {
            const dueSoon = assignments.filter(a => {
              if (!a.deadline || isSolved(a.id)) return false;
              const diff = new Date(a.deadline) - new Date();
              return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
            }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            if (dueSoon.length === 0) return null;
            return (
              <div className="glass-card rounded-2xl overflow-hidden border border-red-500/20">
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/5 px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-400" />
                  <h3 className="text-sm font-black text-white">Due Soon</h3>
                  <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-auto">{dueSoon.length}</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {dueSoon.map(a => {
                    const dl = deadlineLabel(a.deadline);
                    return (
                      <Link key={a.id} to={`/student/workspace/${a.id}`} className="p-4 hover:bg-white/[0.04] transition-colors group block">
                        <div className="flex items-start gap-3">
                          <CalendarClock size={13} className="text-red-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate">{a.title}</p>
                            <p className="text-[10px] text-red-400 font-bold mt-0.5">{dl?.text}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {/* Daily Challenge Widget */}
          {dailyChallenge && (
            <div className="glass-card rounded-2xl overflow-hidden border border-primary/20">
              <div className="bg-gradient-to-r from-primary/10 to-accent/5 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords size={16} className="text-primary-light" />
                  <h3 className="text-sm font-black text-white">Daily Challenge</h3>
                </div>
                <span className="text-[10px] font-bold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full">NEW</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-bold text-sm text-white">{dailyChallenge.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dailyChallenge.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold bg-white/5 text-gray-400 px-2 py-0.5 rounded-lg">{dailyChallenge.language}</span>
                  <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg flex items-center gap-1"><Trophy size={10} /> {dailyChallenge.points} pts</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                    dailyChallenge.proficiency_level === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                    dailyChallenge.proficiency_level === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{dailyChallenge.proficiency_level}</span>
                </div>
                <Link to={`/student/workspace/${dailyChallenge.id}`}
                  className="block w-full btn-primary py-2.5 rounded-xl text-xs font-black text-white text-center">
                  ⚡ Accept Challenge
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2"><Clock size={15} className="text-primary-light" /> Recent Activity</h3>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {recentActivity.map((act, i) => (
                <Link key={i} to={`/student/workspace/${act.assignment_id}`} className="p-4 hover:bg-white/[0.04] transition-colors group block">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${act.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {act.status === 'Success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-300 group-hover:text-primary-light transition-colors truncate">{act.assignments?.title || 'Submission'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-gray-500">{new Date(act.submitted_at).toLocaleDateString()}</p>
                        <span className="text-[10px] text-gray-700">•</span>
                        <p className={`text-[10px] font-bold ${act.status === 'Success' ? 'text-emerald-500/60' : 'text-red-500/60'}`}>{act.status}</p>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-gray-700 group-hover:text-primary-light transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1 mt-1" />
                  </div>
                </Link>
              ))}
              {recentActivity.length === 0 && (
                <div className="p-4 sm:p-8 text-center"><p className="text-[11px] text-gray-600">No recent activity.</p></div>
              )}
            </div>
            <Link to="/student/submissions" className="block p-3 text-center text-[10px] font-bold text-gray-500 hover:text-primary-light transition-colors border-t border-white/5">View All History</Link>
          </div>

          {/* Announcements (moved here for better space utilization) */}
          {announcements.length > 0 && (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Megaphone size={15} className="text-violet-400" /> Announcements</h3>
              <div className="space-y-3">
                {announcements.slice(0, 2).map(a => (
                  <div key={a.id} className="space-y-1">
                    <p className="text-xs font-bold text-gray-300">{a.title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-16 text-center space-y-4">
          <Code2 size={48} className="text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-gray-500">No assignments found</h3>
          <p className="text-gray-600 text-sm">Try adjusting your filters or check back later for new assignments.</p>
        </div>
      )}
    </div>
  );
}
