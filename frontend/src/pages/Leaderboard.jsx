import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, TrendingUp, Search, Filter, CheckCircle2 } from 'lucide-react';

export default function Leaderboard({ profile }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [period, setPeriod] = useState('alltime');

  useEffect(() => {
    setLoading(true);
    const fetchLeaderboard = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/leaderboard?period=${period}`);
      const data = await response.json();
      setStudents(Array.isArray(data.leaders) ? data.leaders : []);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [period]);

  const departments = ['All', ...new Set(students.map(s => s.department).filter(Boolean))];
  const topScore = students[0]?.total_points || 1;

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  const rankStyle = (i) => {
    if (i === 0) return { bg: 'bg-gradient-to-r from-amber-500/15 to-yellow-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400', icon: <Crown size={18} className="text-amber-400" /> };
    if (i === 1) return { bg: 'bg-gradient-to-r from-slate-400/10 to-slate-300/5', border: 'border-slate-400/20', badge: 'bg-slate-400/20 text-slate-300', icon: <Medal size={18} className="text-slate-300" /> };
    if (i === 2) return { bg: 'bg-gradient-to-r from-orange-500/10 to-orange-400/5', border: 'border-orange-500/20', badge: 'bg-orange-500/20 text-orange-400', icon: <Medal size={18} className="text-orange-400" /> };
    return { bg: '', border: 'border-white/[0.04]', badge: 'bg-white/5 text-gray-500', icon: null };
  };

  const rankBadge = (i, total) => {
    const pct = total > 0 ? (i / total) * 100 : 100;
    if (i === 0) return { label: '👑 Champion', color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' };
    if (i < 3) return { label: '🏅 Top 3', color: 'bg-orange-500/15 text-orange-300 border-orange-500/25' };
    if (pct <= 10) return { label: '🔥 Top 10%', color: 'bg-red-500/15 text-red-300 border-red-500/25' };
    if (pct <= 25) return { label: '⚡ Top 25%', color: 'bg-violet-500/15 text-violet-300 border-violet-500/25' };
    return null;
  };

  const periodLabel = { alltime: 'All Time', monthly: 'This Month', weekly: 'This Week' };

  // Soft loading check
  const isDataReady = !loading || students.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
          <Trophy size={14} /> Leaderboard
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Top Performers</h1>
        <p className="text-gray-500 text-sm">Climb the ranks by solving assignments and earning points</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl w-fit mx-auto border border-white/5">
        {['alltime', 'monthly', 'weekly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              period === p ? 'bg-primary/20 text-primary-light shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}>
            {periodLabel[p]}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {filtered.length >= 3 && period === 'alltime' && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end h-64">
          {[1, 0, 2].map((idx) => {
            const s = filtered[idx];
            if (!s) return <div key={idx} />;
            const heights = ['h-52', 'h-44', 'h-36'];
            const colors = [
              'from-amber-500/20 to-amber-600/5 border-amber-500/25',
              'from-slate-400/15 to-slate-500/5 border-slate-400/25',
              'from-orange-500/15 to-orange-600/5 border-orange-500/25'
            ];
            return (
              <div key={idx} className={`${heights[idx]} bg-gradient-to-t ${colors[idx]} border rounded-2xl flex flex-col items-center justify-end p-4 text-center transition-all hover:-translate-y-1`}>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-lg font-black mb-2">
                  {s.name?.charAt(0)}
                </div>
                <p className="font-bold text-sm truncate w-full">
                  {['Educator', 'Admin'].includes(profile?.role) ? <Link to={`/educator/student/${s.id}`} className="hover:text-primary-light transition-colors">{s.name}</Link> : s.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.department || '—'}</p>
                <p className="text-lg font-black gradient-text mt-1">{s.total_points}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">points</p>
                {s.solved_count > 0 && (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={9} /> {s.solved_count} solved
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Period info banner */}
      {period !== 'alltime' && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary-light font-medium text-center">
          Showing rankings based on points earned <strong>{period === 'weekly' ? 'in the last 7 days' : 'in the last 30 days'}</strong>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            {departments.map(d => <option key={d} value={d} className="bg-card">{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
        </div>
        {(search || deptFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setDeptFilter('All'); }} className="text-xs text-primary-light hover:underline font-medium px-2">Clear</button>
        )}
      </div>

      {/* Full List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-light" />
            <h3 className="font-bold">Rankings</h3>
          </div>
          <span className="text-xs text-gray-500">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {!isDataReady ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-6 h-16 animate-pulse bg-white/5"></div>
            ))
          ) : (
            filtered.map((s, i) => {
              const globalRank = students.indexOf(s);
              const style = rankStyle(globalRank);
              const badge = rankBadge(globalRank, students.length);
              const barWidth = Math.max(4, Math.round((s.total_points / topScore) * 100));
              return (
                <div key={s.id} className={`p-4 px-4 sm:px-6 ${style.bg} hover:bg-white/[0.02] transition-colors`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${style.badge}`}>
                      {style.icon || (globalRank + 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">
                          {['Educator', 'Admin'].includes(profile?.role) ? <Link to={`/educator/student/${s.id}`} className="hover:text-primary-light transition-colors">{s.name}</Link> : s.name}
                        </p>
                        {badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">{s.department || '—'} • {s.academic_year || '—'}</p>
                      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-primary/10 text-primary-light text-sm font-bold px-3 py-1 rounded-lg block">
                        {s.total_points || 0}
                      </span>
                      {s.solved_count > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end mt-1">
                          <CheckCircle2 size={9} /> {s.solved_count} solved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isDataReady && filtered.length === 0 && (
            <div className="p-12 text-center text-gray-600">
              {students.length === 0 ? `No activity ${period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'yet'}.` : 'No results found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
