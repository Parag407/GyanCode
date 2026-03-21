import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { History, CheckCircle2, XCircle, Clock, Code2, ArrowRight, Lightbulb, MessageSquare, ArrowLeft, Download, CalendarClock, Target, FileCheck } from 'lucide-react';

export default function Submissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [comments, setComments] = useState({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(import.meta.env.VITE_API_URL + '/submissions', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        setSubmissions(data);
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, []);

  const statusIcon = (status) => {
    if (status === 'Success') return <CheckCircle2 size={16} className="text-emerald-400" />;
    if (status === 'Failed') return <XCircle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-amber-400" />;
  };

  const fetchComments = async (submissionId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/submissions/${submissionId}/comments`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => ({ ...prev, [submissionId]: c }));
    }
  };

  const handleToggleExpand = (idx, subId) => {
    if (expanded === idx) {
      setExpanded(null);
    } else {
      setExpanded(idx);
      if (!comments[subId]) fetchComments(subId);
    }
  };

  const statusColor = (status) => {
    if (status === 'Success') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'Failed') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const languages = ['All', ...new Set(submissions.map(s => s.language).filter(Boolean))];

  // Date range filter
  const dateFilterFn = (s) => {
    if (dateFilter === 'All') return true;
    const submitted = new Date(s.submitted_at);
    const now = new Date();
    if (dateFilter === 'Today') {
      return submitted.toDateString() === now.toDateString();
    }
    if (dateFilter === 'Week') {
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return submitted >= oneWeekAgo;
    }
    if (dateFilter === 'Month') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return submitted >= oneMonthAgo;
    }
    return true;
  };

  const filtered = submissions.filter(s => {
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchLang = langFilter === 'All' || s.language === langFilter;
    return matchStatus && matchLang && dateFilterFn(s);
  });

  const totalSuccess = submissions.filter(s => s.status === 'Success').length;
  const totalFailed = submissions.filter(s => s.status === 'Failed').length;
  const passRate = submissions.length ? Math.round((totalSuccess / submissions.length) * 100) : 0;

  // Export CSV
  const handleExportCSV = () => {
    const header = ['Title', 'Status', 'Language', 'Points', 'Submitted At'];
    const rows = filtered.map(s => [
      `"${s.assignments?.title || 'Assignment'}"`,
      s.status,
      s.language || '',
      s.status === 'Success' ? (s.assignments?.points || 0) : 0,
      new Date(s.submitted_at).toLocaleString()
    ]);
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5 w-fit">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <History size={28} className="text-primary-light" /> Submission History
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review your past submissions and AI feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">{filtered.length} of {submissions.length}</span>
          {filtered.length > 0 && (
            <button onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all">
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {submissions.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{submissions.length}</p>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"><FileCheck size={11} /> Attempts</p>
            </div>
            <div className="text-center sm:border-l border-white/10">
              <p className="text-2xl font-black text-emerald-400">
                {new Set(submissions.filter(s => s.status === 'Success').map(s => s.assignment_id)).size}
              </p>
              <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"><CheckCircle2 size={11} /> Solved</p>
            </div>
            <div className="text-center sm:border-l border-white/10">
              <p className="text-2xl font-black text-white">{totalSuccess}</p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"><History size={11} /> Passed Sub.</p>
            </div>
            <div className="text-center sm:border-l border-white/10">
              <p className="text-2xl font-black text-red-400">{totalFailed}</p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"><XCircle size={11} /> Failed Sub.</p>
            </div>
            <div className="text-center sm:border-l border-white/10">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-black text-primary-light">{passRate}</p>
                <span className="text-xs text-gray-500 font-bold">%</span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"><Target size={11} /> Pass Rate</p>
            </div>
          </div>
          {/* Visual Pass Rate Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Pass Rate</span>
              <span>{passRate}%</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                style={{ width: `${passRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>{totalSuccess} passed</span>
              <span>{totalFailed} failed</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status filter */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
          {['All', 'Success', 'Failed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s ? (s === 'Success' ? 'bg-emerald-500/15 text-emerald-400' : s === 'Failed' ? 'bg-red-500/15 text-red-400' : 'bg-primary/20 text-primary-light') : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>{s}</button>
          ))}
        </div>
        {/* Language filter */}
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs font-medium appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
          {languages.map(l => <option key={l} value={l} className="bg-card">{l === 'All' ? '🌐 All Languages' : l}</option>)}
        </select>
        {/* Date filter */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
          {['All', 'Today', 'Week', 'Month'].map(d => (
            <button key={d} onClick={() => setDateFilter(d)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                dateFilter === d ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              {d === 'Today' && <CalendarClock size={11} />} {d}
            </button>
          ))}
        </div>
        {(statusFilter !== 'All' || langFilter !== 'All' || dateFilter !== 'All') && (
          <button onClick={() => { setStatusFilter('All'); setLangFilter('All'); setDateFilter('All'); }}
            className="text-xs text-primary-light hover:underline font-medium">Clear filters</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center space-y-4">
          <Code2 size={48} className="text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-gray-500">{submissions.length === 0 ? 'No submissions yet' : 'No submissions match your filters'}</h3>
          <p className="text-gray-600 text-sm">
            {submissions.length === 0 ? <>Go to the <Link to="/student/dashboard" className="text-primary-light hover:underline">dashboard</Link> to start solving assignments.</> : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub, i) => (
            <div key={sub.id} className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10">
              <div
                className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => handleToggleExpand(i, sub.id)}
              >
                {statusIcon(sub.status)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{sub.assignments?.title || 'Assignment'}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {new Date(sub.submitted_at).toLocaleString()} • {sub.language}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusColor(sub.status)}`}>
                  {sub.status}
                </span>
                {sub.assignments?.points && sub.status === 'Success' && (
                  <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg">
                    +{sub.assignments.points} pts
                  </span>
                )}
                <Link to={`/student/workspace/${sub.assignment_id}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary-light transition-all flex items-center gap-1.5 group/btn" title="Open in Workspace">
                  <span className="text-[10px] font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity">Workspace</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
                <ArrowRight size={14} className={`text-gray-600 transition-transform ${expanded === i ? 'rotate-90' : ''}`} />
              </div>

              {expanded === i && (
                <div className="border-t border-white/5 animate-fade-in">
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Code</p>
                        <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-64 overflow-y-auto border border-white/5">
                          {sub.code}
                        </pre>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <MessageSquare size={13} /> Educator Feedback
                        </p>
                        <div className="space-y-3">
                          {comments[sub.id]?.map((c, ci) => (
                            <div key={ci} className={`flex flex-col gap-1 ${c.author.role === 'Educator' ? 'items-start' : 'items-end'}`}>
                              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                c.author.role === 'Educator' ? 'bg-primary/20 text-primary-light rounded-tl-none' : 'bg-white/5 text-gray-300 rounded-tr-none'
                              }`}>
                                {c.body}
                              </div>
                              <span className="text-[9px] text-gray-600 px-1">{c.author.name} • {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                          {(!comments[sub.id] || comments[sub.id].length === 0) && (
                            <div className="py-4 sm:py-8 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                              <p className="text-[10px] text-gray-600 italic">No feedback received yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {sub.last_hint && (
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                        <Lightbulb size={18} className="text-primary-light shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-primary-light mb-1">AI Hint</p>
                          <p className="text-sm text-gray-400 leading-relaxed">{sub.last_hint}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
