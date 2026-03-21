import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Code2, Trophy, Search, LayoutGrid, List, SortAsc,
  CheckCircle2, Clock, Sparkles, ArrowRight, Tag, BookOpen,
  X, BarChart2, Send
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: 'newest', label: '🕐 Newest' },
  { value: 'pts-high', label: '⬆ Pts: High→Low' },
  { value: 'pts-low', label: '⬇ Pts: Low→High' },
  { value: 'alpha', label: '🔤 A→Z' },
];

const DIFF_CONFIG = {
  Beginner: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500', ring: 'border-emerald-500 text-emerald-400', dot: 'bg-emerald-400' },
  Intermediate: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500', ring: 'border-amber-500 text-amber-400', dot: 'bg-amber-400' },
  Advanced: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500', ring: 'border-red-500 text-red-400', dot: 'bg-red-400' },
};

const LANG_ICONS = {
  Python: '🐍', JavaScript: '⚡', Java: '☕', C: '⚙️', 'C++': '🔷',
};

export default function Assignments() {
  const [apiProblems, setApiProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Solved | Unsolved | Attempted
  const [sortMode, setSortMode] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  // ── Fetch from API ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !mounted) { setLoading(false); return; }

        const [assignRes, subRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/assignments', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }),
          fetch(import.meta.env.VITE_API_URL + '/submissions', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }),
        ]);

        if (mounted) {
          const assigns = assignRes.ok ? await assignRes.json() : [];
          if (Array.isArray(assigns)) setApiProblems(assigns);

          if (subRes.ok) {
            const subs = await subRes.json();
            const solved = new Set();
            const attempted = new Set();
            subs.forEach(s => {
              if (s.status === 'Success') solved.add(s.assignment_id);
              else attempted.add(s.assignment_id);
            });
            setSolvedIds(solved);
            setAttemptedIds(attempted);
          }
        }
      } catch (e) {
        console.error('Assignments fetch error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Provide API Data ────────────────────────────────────────────────────────
  const allProblems = useMemo(() => {
    return apiProblems;
  }, [apiProblems]);

  // ── Derived filter options ──────────────────────────────────────────────────
  const languages = useMemo(() =>
    ['All', ...new Set(allProblems.map(p => p.language).filter(Boolean))],
    [allProblems]
  );
  const categories = useMemo(() =>
    ['All', ...new Set(allProblems.map(p => p.category).filter(Boolean))],
    [allProblems]
  );

  // ── Status helper ───────────────────────────────────────────────────────────
  const statusOf = (p) => {
    if (solvedIds.has(p.id)) return 'Solved';
    if (attemptedIds.has(p.id)) return 'Attempted';
    return 'New';
  };

  // ── Apply filters + sort ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allProblems.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      const matchDiff = diffFilter === 'All' || p.proficiency_level === diffFilter;
      const matchLang = langFilter === 'All' || p.language === langFilter;
      const matchCat = catFilter === 'All' || p.category === catFilter;
      const st = statusOf(p);
      const matchStatus = statusFilter === 'All' || st === statusFilter;
      return matchSearch && matchDiff && matchLang && matchCat && matchStatus;
    });

    list.sort((a, b) => {
      if (sortMode === 'pts-high') return b.points - a.points;
      if (sortMode === 'pts-low') return a.points - b.points;
      if (sortMode === 'alpha') return a.title.localeCompare(b.title);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return list;
  }, [allProblems, search, diffFilter, langFilter, catFilter, statusFilter, sortMode, solvedIds, attemptedIds]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allProblems.length;
    const solved = allProblems.filter(p => solvedIds.has(p.id)).length;
    const attempted = allProblems.filter(p => attemptedIds.has(p.id) && !solvedIds.has(p.id)).length;
    const pct = total ? Math.round((solved / total) * 100) : 0;
    return { total, solved, attempted, pct };
  }, [allProblems, solvedIds, attemptedIds]);

  const hasActiveFilters = diffFilter !== 'All' || langFilter !== 'All' || catFilter !== 'All' || statusFilter !== 'All' || search;

  const clearFilters = () => {
    setSearch(''); setDiffFilter('All'); setLangFilter('All'); setCatFilter('All'); setStatusFilter('All');
  };

  // ── Problem destination ─────────────────────────────────────────────────────
  const problemLink = (p) => `/student/assignmentdetail/${p.id}`;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent p-2.5 rounded-2xl">
              <BookOpen size={28} className="text-white" />
            </div>
            <span>Assignments</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Review and solve your educator's curated coding challenges
          </p>
        </div>

        {/* Compact progress */}
        <div className="glass-card rounded-2xl px-4 sm:px-6 py-4 flex items-center gap-4 sm:gap-6 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400">{stats.solved}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase">Solved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{stats.attempted}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-400">{stats.total}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase">Total</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="w-24 space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Progress</span><span className="text-primary-light font-bold">{stats.pct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Controls bar ── */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problems, categories..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <SortAsc size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select value={sortMode} onChange={e => setSortMode(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-card">{o.label}</option>)}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          <button onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="Grid view"><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="List view"><List size={16} /></button>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Difficulty */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                diffFilter === d
                  ? d === 'All' ? 'bg-primary/20 text-primary-light'
                    : `${DIFF_CONFIG[d].bg} ${DIFF_CONFIG[d].color}`
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>{d}</button>
          ))}
        </div>

        {/* Status */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {['All', 'Solved', 'Attempted', 'New'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === s
                  ? s === 'Solved' ? 'bg-emerald-500/15 text-emerald-400'
                    : s === 'Attempted' ? 'bg-amber-500/15 text-amber-400'
                    : s === 'New' ? 'bg-primary/15 text-primary-light'
                    : 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              {s === 'Solved' && <CheckCircle2 size={10} />}
              {s === 'Attempted' && <Clock size={10} />}
              {s === 'New' && <Sparkles size={10} />}
              {s}
            </button>
          ))}
        </div>

        {/* Language */}
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
          {languages.map(l => <option key={l} value={l} className="bg-card">{l === 'All' ? '🌐 All Languages' : `${LANG_ICONS[l] || '💻'} ${l}`}</option>)}
        </select>

        {/* Category */}
        {categories.length > 2 && (
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            {categories.map(c => <option key={c} value={c} className="bg-card">{c === 'All' ? '📁 All Categories' : c}</option>)}
          </select>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary-light hover:underline font-medium px-1">
            <X size={12} /> Clear filters
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-gray-600 font-medium">
          {filtered.length} of {allProblems.length} problem{allProblems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Category quick-filter chips (only show when API has categories) ── */}
      {categories.length > 4 && (
        <div className="flex gap-2 flex-wrap">
          {categories.slice(1).map(c => (
            <button key={c} onClick={() => setCatFilter(catFilter === c ? 'All' : c)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                catFilter === c
                  ? 'bg-primary/20 border-primary/40 text-primary-light'
                  : 'bg-white/[0.02] border-white/10 text-gray-500 hover:text-white hover:border-white/20'
              }`}>
              <Tag size={10} className="inline mr-1" />{c}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="py-24 text-center glass-card rounded-3xl space-y-4">
          <div className="text-3xl sm:text-5xl">🔍</div>
          <h3 className="text-lg font-bold text-gray-400">No problems match your filters</h3>
          <p className="text-sm text-gray-600">Try adjusting the search or filters above.</p>
          <button onClick={clearFilters} className="btn-primary px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold text-white">
            Clear Filters
          </button>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => {
            const status = statusOf(p);
            const diff = DIFF_CONFIG[p.proficiency_level] || DIFF_CONFIG.Beginner;
            const workspaceLink = `/student/workspace/${p.id}`;
            return (
              <div key={p.id} className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 hover:-translate-y-1.5 transition-all duration-200 group relative overflow-hidden flex flex-col">
                {/* Background glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity ${diff.bg}`} />

                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 ${diff.ring}`}>
                    <span className="text-xl">{LANG_ICONS[p.language] || '💻'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {status === 'Solved' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={9} /> Solved
                      </span>
                    )}
                    {status === 'Attempted' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                        <Clock size={9} /> Attempted
                      </span>
                    )}
                    {status === 'New' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary-light px-2 py-0.5 rounded-full">
                        <Sparkles size={9} /> New
                      </span>
                    )}
                    <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Trophy size={10} /> {p.points} pts
                    </span>
                  </div>
                </div>

                {/* Title + description */}
                <div className="flex-1">
                  <h3 className="font-black text-base group-hover:text-primary-light transition-colors">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                    {p.proficiency_level}
                  </span>
                  <span className="text-[10px] font-semibold bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                    {p.language}
                  </span>
                  {p.category && (
                    <span className="text-[10px] font-semibold bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                  <Link to={problemLink(p)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                    <ArrowRight size={12} /> View Problem
                  </Link>
                  <Link to={workspaceLink}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold btn-primary text-white transition-all shadow-lg shadow-primary/20">
                    <Send size={12} /> Submit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="space-y-2">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-[2.5rem_1fr_6rem_5rem_4rem_4rem_5rem_9rem] items-center gap-4 px-5 pb-2 text-[10px] text-gray-600 font-bold uppercase tracking-wider">
            <div>#</div>
            <div>Problem</div>
            <div>Category</div>
            <div>Language</div>
            <div>Difficulty</div>
            <div>Points</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {filtered.map((p, i) => {
            const status = statusOf(p);
            const diff = DIFF_CONFIG[p.proficiency_level] || DIFF_CONFIG.Beginner;
            const workspaceLink = `/student/workspace/${p.id}`;
            return (
              <div key={p.id}
                className="glass-card rounded-xl px-5 py-4 grid grid-cols-1 md:grid-cols-[2.5rem_1fr_6rem_5rem_4rem_4rem_5rem_9rem] items-center gap-4 hover:bg-white/[0.04] transition-all group">
                {/* Index */}
                <span className="hidden md:block text-sm font-bold text-gray-600">{i + 1}</span>
                {/* Title */}
                <Link to={problemLink(p)} className="hover:text-primary-light transition-colors">
                  <h3 className="font-bold text-sm">{p.title}</h3>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-1 md:hidden">{p.language} • {p.proficiency_level} • {p.points} pts</p>
                </Link>
                {/* Category */}
                <span className="hidden md:inline-block text-[11px] text-gray-500 font-medium">{p.category || '—'}</span>
                {/* Language */}
                <span className="hidden md:flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                  {LANG_ICONS[p.language]} {p.language}
                </span>
                {/* Difficulty */}
                <span className={`hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${diff.bg} ${diff.color}`}>
                  {p.proficiency_level}
                </span>
                {/* Points */}
                <span className="hidden md:inline-block text-[11px] font-bold text-amber-400">{p.points} pts</span>
                {/* Status */}
                <div className="hidden md:flex items-center gap-1.5">
                  {status === 'Solved' && <><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[10px] text-emerald-400 font-bold">Solved</span></>}
                  {status === 'Attempted' && <><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[10px] text-amber-400 font-bold">Attempted</span></>}
                  {status === 'New' && <><div className="w-2 h-2 rounded-full bg-gray-600" /><span className="text-[10px] text-gray-500 font-bold">New</span></>}
                </div>
                {/* Action buttons */}
                <div className="flex mt-3 md:mt-0 items-center justify-end md:justify-start gap-2 md:gap-1.5">
                  <Link to={problemLink(p)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                    <ArrowRight size={10} /> View
                  </Link>
                  <Link to={workspaceLink}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold btn-primary text-white transition-all flex items-center gap-1 shadow-sm shadow-primary/20">
                    <Send size={10} /> Submit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── End List View ── */}
    </div>
  );
}
