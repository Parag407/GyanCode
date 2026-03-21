import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Code2, CheckCircle2, XCircle, User, Clock, Trophy, Eye,
  ChevronDown, Search, Pencil, Sparkles, CalendarClock, MessageSquare,
  Send, Loader2, Tag, BookOpen, AlertCircle, LayoutGrid, List, SortAsc, ArrowRight
} from 'lucide-react';

const LANG_ICONS = {
  Python: '🐍', JavaScript: '⚡', Java: '☕', C: '⚙️', 'C++': '🔷',
};

const DIFF_CONFIG = {
  Beginner:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500' },
  Intermediate: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500'   },
  Advanced:     { color: 'text-red-400',      bg: 'bg-red-500/10',     border: 'border-red-500'     },
};

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]); // For list view
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [comments, setComments] = useState({});
  const [commenting, setCommenting] = useState({});
  const [newComment, setNewComment] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortMode, setSortMode] = useState('newest');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted || !session) { setLoading(false); return; }

        // Get user role — try Supabase first, fallback to backend (bypasses RLS)
        let role = null;
        const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (profile?.role) {
          role = profile.role;
        } else {
          const res = await fetch(import.meta.env.VITE_API_URL + '/profile', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const p = await res.json();
            role = p.role;
          }
        }
        if (!isMounted) return;
        setUserRole(role);

        if (id) {
          // Fetch assignment detail (+submissions for educators)
          const url = `${import.meta.env.VITE_API_URL}/assignments/${id}${role === 'Educator' ? '/submissions' : ''}`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          const json = await res.json();
          if (isMounted) setData(json);
        } else {
          // Fetch all assignments (List View)
          const res = await fetch(import.meta.env.VITE_API_URL + '/assignments', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          const json = await res.json();
          if (isMounted) setAssignments(Array.isArray(json) ? json : []);
        }
      } catch (err) {
        console.error('Assignment detail fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  const fetchComments = async (submissionId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/submissions/${submissionId}/comments`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => ({ ...prev, [submissionId]: c }));
    }
  };

  const handlePostComment = async (submissionId) => {
    if (!newComment.trim()) return;
    setCommenting(prev => ({ ...prev, [submissionId]: true }));
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/submissions/${submissionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ body: newComment })
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => ({ ...prev, [submissionId]: [...(prev[submissionId] || []), c] }));
      setNewComment('');
    }
    setCommenting(prev => ({ ...prev, [submissionId]: false }));
  };

  const toggleExpand = (idx, subId) => {
    if (expandedIdx === idx) {
      setExpandedIdx(null);
    } else {
      setExpandedIdx(idx);
      if (!comments[subId]) fetchComments(subId);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  // ──────────────────────── LIST VIEW ──────────────────────────
  const diffRing = (level) => {
    if (level === 'Beginner') return 'border-emerald-500 text-emerald-400';
    if (level === 'Intermediate') return 'border-amber-500 text-amber-400';
    return 'border-red-500 text-red-400';
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (sortMode === 'pts-high') return b.points - a.points;
    if (sortMode === 'pts-low') return a.points - b.points;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (!id) {
    return (
      <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
              <BookOpen size={28} className="text-primary-light" /> Assignments
            </h1>
            <p className="text-gray-500 text-sm mt-1">Explore and solve curated challenges</p>
          </div>
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SortAsc size={15} className="text-gray-500" />
            <select value={sortMode} onChange={e => setSortMode(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
              <option value="newest" className="bg-card">🕐 Newest First</option>
              <option value="pts-high" className="bg-card">⬆ Points: High→Low</option>
              <option value="pts-low" className="bg-card">⬇ Points: Low→High</option>
            </select>
          </div>
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sortedAssignments.map(a => (
              <Link key={a.id} to={userRole === 'Educator' ? `/educator/assignment/${a.id}` : `/student/assignmentdetail/${a.id}`}
                className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 hover:-translate-y-1 transition-all group">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg ${diffRing(a.proficiency_level)}`}>
                    {LANG_ICONS[a.language] || '💻'}
                  </div>
                  <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Trophy size={10} /> {a.points} pts
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold group-hover:text-primary-light transition-colors">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-semibold text-gray-400">{a.language} • {a.proficiency_level}</span>
                  <span className="text-xs font-bold text-primary-light flex items-center gap-1">
                    {userRole === 'Educator' ? 'View Submissions' : 'View & Solve'} <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
            {assignments.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-3xl">
                <p className="text-gray-500">No assignments found. Please contact your educator.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAssignments.map(a => (
              <Link key={a.id} to={userRole === 'Educator' ? `/educator/assignment/${a.id}` : `/student/assignmentdetail/${a.id}`}
                className="glass-card rounded-xl px-4 sm:px-6 py-4 flex items-center gap-5 hover:bg-white/[0.03] transition-all group">
                <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 text-base ${diffRing(a.proficiency_level)}`}>
                  {LANG_ICONS[a.language] || '💻'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm group-hover:text-primary-light transition-colors truncate">{a.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{a.language} • {a.proficiency_level}</p>
                </div>
                <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg shrink-0">{a.points} pts</span>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-primary-light group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
            {assignments.length === 0 && (
              <div className="py-20 text-center glass-card rounded-3xl">
                <p className="text-gray-500">No assignments found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────── DETAIL VIEW ──────────────────────────
  const assignment = data?.assignment || (data?.id ? data : null);
  const submissions = data?.submissions || [];
  const testCases = assignment?.test_cases || [];

  if (!assignment) return (
    <div className="text-center py-20 glass-card rounded-2xl max-w-2xl mx-auto m-8">
      <Code2 size={48} className="mx-auto text-gray-600 mb-4" />
      <h3 className="text-lg font-bold text-gray-500">Assignment not found</h3>
      <p className="text-gray-600 text-sm mt-2">The requested challenge could not be loaded or doesn't exist.</p>
      <button onClick={() => navigate(-1)} className="mt-6 text-primary-light font-bold hover:underline">Go Back</button>
    </div>
  );

  const isExpired = assignment.deadline && new Date(assignment.deadline) < new Date();
  const diff = DIFF_CONFIG[assignment.proficiency_level] || DIFF_CONFIG.Beginner;
  const publicTests = testCases.filter(tc => !tc.is_hidden);

  // ──────────────────────── STUDENT DETAIL ──────────────────────────
  if (userRole === 'Student') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm px-4 py-2 rounded-xl hover:bg-white/5">
          <ArrowLeft size={16} /> Back to Assignments
        </button>

        {/* Header Card */}
        <div className="glass-card rounded-3xl p-4 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-3xl ${diff.border} ${diff.bg}`}>
                {LANG_ICONS[assignment.language] || '💻'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{assignment.title}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-bold bg-white/5 text-gray-400 px-3 py-1 rounded-lg">{assignment.language}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg ${diff.bg} ${diff.color}`}>{assignment.proficiency_level}</span>
                  <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Trophy size={11} /> {assignment.points} Points
                  </span>
                  {assignment.category && (
                    <span className="text-xs font-bold bg-white/5 text-gray-400 px-3 py-1 rounded-lg flex items-center gap-1">
                      <Tag size={11} /> {assignment.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Deadline badge */}
            {assignment.deadline && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 ${
                isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <CalendarClock size={16} />
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-70">Deadline</p>
                  <p>{new Date(assignment.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                {isExpired && <AlertCircle size={16} className="ml-1" />}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-widest">Problem Statement</p>
            <p className="text-gray-300 leading-relaxed">{assignment.description}</p>
          </div>

          {/* Starter Code */}
          {assignment.starter_code && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1.5">
                <Code2 size={12} /> Starter Code
              </p>
              <pre className="bg-black/30 border border-white/5 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
                {assignment.starter_code}
              </pre>
            </div>
          )}

          {/* Public Test Cases */}
          {publicTests.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase text-gray-500 tracking-widest">Example Test Cases</p>
              <div className="grid gap-3">
                {publicTests.map((tc, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Input</p>
                      <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap">{tc.input || '(none)'}</pre>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Expected Output</p>
                      <pre className="text-sm font-mono text-primary-light whitespace-pre-wrap">{tc.output}</pre>
                    </div>
                  </div>
                ))}
                {testCases.some(tc => tc.is_hidden) && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {testCases.filter(tc => tc.is_hidden).length} hidden test case(s) will also be evaluated on submission.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Expected I/O (legacy fallback) */}
          {publicTests.length === 0 && (assignment.expected_input || assignment.expected_output) && (
            <div className="grid grid-cols-2 gap-4">
              {assignment.expected_input && (
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-2">Sample Input</p>
                  <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap">{assignment.expected_input}</pre>
                </div>
              )}
              {assignment.expected_output && (
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-2">Expected Output</p>
                  <pre className="text-sm font-mono text-primary-light whitespace-pre-wrap">{assignment.expected_output}</pre>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
            {isExpired ? (
              <div className="flex-1 py-4 rounded-2xl font-black text-center text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2">
                <AlertCircle size={20} /> Deadline Passed — Submission Closed
              </div>
            ) : (
              <>
                <Link to={`/student/workspace/${id}`}
                  className="flex-1 btn-primary py-4 rounded-2xl font-black text-white text-center flex items-center justify-center gap-2 text-lg shadow-2xl shadow-primary/30">
                  <Sparkles size={20} /> {assignment.is_solved ? 'Improve Solution' : assignment.user_status ? 'Resume Solving' : 'Start Solving Now'}
                </Link>
                {!assignment.is_solved && (
                  <Link to={`/student/workspace/${id}`}
                    className="flex-1 py-4 rounded-2xl font-black text-center flex items-center justify-center gap-2 text-lg border-2 border-primary/40 text-primary-light hover:bg-primary/10 transition-all">
                    <Send size={20} /> Submit Assignment
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────── EDUCATOR DETAIL ──────────────────────────
  const successCount = submissions?.filter(s => s.status === 'Success').length || 0;
  const uniqueStudents = new Set(submissions?.map(s => s.user_id)).size || 0;
  const filtered = submissions?.filter(s => {
    const matchSearch = !search || s.users?.name?.toLowerCase().includes(search.toLowerCase()) || s.users?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5">
          <ArrowLeft size={16} /> Back
        </button>
        <Link to={`/educator/edit-assignment/${id}`}
          className="px-4 py-2 rounded-xl text-sm font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-all flex items-center gap-2">
          <Pencil size={14} /> Edit Assignment
        </Link>
      </div>

      {/* Assignment Info */}
      <div className="glass-card rounded-2xl p-4 sm:p-8 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl ${diff.border} ${diff.bg}`}>
              {LANG_ICONS[assignment.language] || '💻'}
            </div>
            <div>
              <h1 className="text-2xl font-black">{assignment.title}</h1>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-bold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg">{assignment.language}</span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${diff.bg} ${diff.color}`}>{assignment.proficiency_level}</span>
                <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Trophy size={10} /> {assignment.points} pts
                </span>
                {assignment.deadline && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <CalendarClock size={10} /> {new Date(assignment.deadline).toLocaleDateString()}
                    {isExpired ? ' (Expired)' : ''}
                  </span>
                )}
                {assignment.is_solved && (
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/30 animate-pulse">
                    <CheckCircle2 size={10} /> Solved
                  </span>
                )}
                {!assignment.is_solved && assignment.user_status && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-500/30 ${assignment.user_status === 'Failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <AlertCircle size={10} /> {assignment.user_status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {assignment.description && <p className="text-gray-400 text-sm leading-relaxed">{assignment.description}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-white">{submissions?.length || 0}</p><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Total Submissions</p></div>
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-blue-400">{uniqueStudents}</p><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Unique Students</p></div>
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-emerald-400">{successCount}</p><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Passed</p></div>
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-red-400">{(submissions?.length || 0) - successCount}</p><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Failed</p></div>
      </div>

      {/* Submissions List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Eye size={18} className="text-primary-light" /> Student Submissions</h3>
            <span className="text-xs text-gray-500">{filtered.length} of {submissions?.length || 0}</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                placeholder="Search by student..." />
            </div>
            <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
              {['All', 'Success', 'Failed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === s
                      ? s === 'Success' ? 'bg-emerald-500/15 text-emerald-400'
                        : s === 'Failed' ? 'bg-red-500/15 text-red-400'
                        : 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {filtered.map((sub, i) => (
            <div key={sub.id}>
              <div className="flex items-center p-4 px-4 sm:px-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleExpand(i, sub.id)}>
                {sub.status === 'Success'
                  ? <CheckCircle2 size={16} className="text-emerald-400 mr-3 shrink-0" />
                  : <XCircle size={16} className="text-red-400 mr-3 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{sub.users?.name || 'Unknown'}</p>
                  <p className="text-[11px] text-gray-500">{sub.users?.email} · {sub.users?.department}</p>
                </div>
                <span className="text-[10px] text-gray-500 mr-4 shrink-0">
                  {sub.submitted_at && new Date(sub.submitted_at).toLocaleDateString()}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg mr-2 shrink-0 ${
                  sub.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>{sub.status}</span>
                <ChevronDown size={14} className={`text-gray-600 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`} />
              </div>
              {expandedIdx === i && (
                <div className="p-4 sm:p-6 bg-white/[0.01] border-t border-white/5 space-y-4">
                  <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto">{sub.code}</pre>
                  {/* Comments */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={12} /> Feedback
                    </p>
                    {(comments[sub.id] || []).map((c, ci) => (
                      <div key={ci} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User size={10} className="text-primary-light" />
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3 flex-1">
                          <p className="text-[10px] font-bold text-primary-light mb-1">{c.author?.name}</p>
                          <p className="text-sm text-gray-300">{c.body}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input value={newComment} onChange={e => setNewComment(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                        placeholder="Leave feedback..." />
                      <button onClick={() => handlePostComment(sub.id)} disabled={commenting[sub.id] || !newComment.trim()}
                        className="btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2">
                        {commenting[sub.id] ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="p-10 text-center text-gray-500">No submissions yet.</div>}
        </div>
      </div>
    </div>
  );
}
