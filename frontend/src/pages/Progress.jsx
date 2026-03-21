import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Trophy, Target, Award, TrendingUp, Hash, CheckCircle2, XCircle, Calendar, Flame, Code2, ArrowLeft, Zap, Star, Shield, Sparkles, Medal } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ── Level system ──────────────────────────────────────────────
const LEVELS = [
  { level: 1, min: 0,    max: 99,   label: 'Novice',      color: 'text-gray-400',    bg: 'from-gray-500/20 to-gray-600/10' },
  { level: 2, min: 100,  max: 299,  label: 'Apprentice',  color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/10' },
  { level: 3, min: 300,  max: 599,  label: 'Coder',       color: 'text-blue-400',    bg: 'from-blue-500/20 to-cyan-500/10' },
  { level: 4, min: 600,  max: 999,  label: 'Developer',   color: 'text-violet-400',  bg: 'from-violet-500/20 to-purple-500/10' },
  { level: 5, min: 1000, max: 1999, label: 'Engineer',    color: 'text-amber-400',   bg: 'from-amber-500/20 to-orange-500/10' },
  { level: 6, min: 2000, max: Infinity, label: 'Architect', color: 'text-red-400',   bg: 'from-red-500/20 to-pink-500/10' },
];

function getLevel(points) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

function getLevelProgress(points) {
  const lvl = getLevel(points);
  if (lvl.max === Infinity) return 100;
  return Math.round(((points - lvl.min) / (lvl.max - lvl.min + 1)) * 100);
}

// ── Achievement badges ────────────────────────────────────────
function getBadges({ successCount, totalSubmissions, rank, totalStudents, certificateCount, streak, solvedCount }) {
  const badges = [];
  if (successCount >= 1) badges.push({ icon: '🎖️', label: 'First Solve', desc: 'Solved your first assignment', color: 'border-emerald-500/30 bg-emerald-500/10' });
  if (successCount >= 5) badges.push({ icon: '🏅', label: 'Problem Solver', desc: '5 assignments solved', color: 'border-blue-500/30 bg-blue-500/10' });
  if (successCount >= 10) badges.push({ icon: '🔟', label: 'Deca Coder', desc: '10 assignments solved', color: 'border-violet-500/30 bg-violet-500/10' });
  if (successCount >= 25) badges.push({ icon: '🏆', label: 'Master Coder', desc: '25 assignments solved', color: 'border-amber-500/30 bg-amber-500/10' });
  if (totalSubmissions >= 20) badges.push({ icon: '📤', label: 'Persistent', desc: '20+ total submissions', color: 'border-cyan-500/30 bg-cyan-500/10' });
  if (rank === 1) badges.push({ icon: '👑', label: 'Champion', desc: '#1 on the leaderboard', color: 'border-amber-500/40 bg-amber-500/15' });
  if (rank <= 3 && rank > 1) badges.push({ icon: '🥇', label: 'Podium Finisher', desc: 'Top 3 on leaderboard', color: 'border-orange-500/30 bg-orange-500/10' });
  if (totalStudents > 0 && rank <= Math.ceil(totalStudents * 0.1)) badges.push({ icon: '⚡', label: 'Top 10%', desc: 'Elite performer', color: 'border-red-500/30 bg-red-500/10' });
  if (streak >= 3) badges.push({ icon: '🔥', label: 'On Fire', desc: `${streak}-day streak`, color: 'border-orange-500/30 bg-orange-500/10' });
  if (streak >= 7) badges.push({ icon: '🌟', label: 'Weekly Warrior', desc: '7-day streak achieved', color: 'border-yellow-500/30 bg-yellow-500/10' });
  if (certificateCount >= 1) badges.push({ icon: '📜', label: 'Certified', desc: 'Earned a certificate', color: 'border-violet-500/30 bg-violet-500/10' });
  const successRate = totalSubmissions > 0 ? (successCount / totalSubmissions) * 100 : 0;
  if (successRate >= 80 && totalSubmissions >= 5) badges.push({ icon: '🎯', label: 'Sharpshooter', desc: '80%+ success rate', color: 'border-emerald-500/30 bg-emerald-500/10' });
  return badges;
}

export default function Progress() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session) {
          const res = await fetch(import.meta.env.VITE_API_URL + '/progress', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        console.error("Progress Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProgress();
    return () => { isMounted = false; };
  }, []);

  // --- Computed streak from recent submissions ---
  const computeStreak = (submissions = []) => {
    if (!submissions.length) return 0;
    const dates = [...new Set(submissions.map(s => new Date(s.submitted_at).toDateString()))];
    dates.sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) streak++;
      else break;
    }
    return streak;
  };

  if (loading && !data) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;
  if (!data && !loading) return (
    <div className="text-center py-20 glass-card rounded-2xl">
      <Code2 size={48} className="mx-auto text-gray-600 mb-4" />
      <h3 className="text-lg font-bold text-gray-500">Failed to load progress data</h3>
      <p className="text-gray-600 text-sm mt-2">Please check your connection or try again later.</p>
    </div>
  );

  const successRate = data.totalSubmissions ? Math.round((data.successCount / data.totalSubmissions) * 100) : 0;
  const streak = computeStreak(data.recentSubmissions);
  const totalAssignments = data.totalAssignments || 0;
  const goalPct = totalAssignments > 0 ? Math.min(100, Math.round((data.uniqueSolvedCount / totalAssignments) * 100)) : 0;
  const points = data.profile?.total_points || 0;
  const currentLevel = getLevel(points);
  const levelPct = getLevelProgress(points);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

  // Most active day
  const mostActiveDay = data.weeklyActivity?.reduce((best, d) => (!best || d.count > best.count) ? d : best, null);

  const weeklyData = {
    labels: data.weeklyActivity.map(w => w.day),
    datasets: [{
      label: 'Submissions',
      data: data.weeklyActivity.map(w => w.count),
      backgroundColor: '#818cf8',
      borderRadius: 6, borderSkipped: false, barThickness: 28,
    }]
  };

  const langLabels = Object.keys(data.langStats);
  const langData = {
    labels: langLabels,
    datasets: [
      { label: 'Passed', data: langLabels.map(l => data.langStats[l].success), backgroundColor: '#34d399', borderRadius: 6, borderSkipped: false },
      { label: 'Failed', data: langLabels.map(l => data.langStats[l].total - data.langStats[l].success), backgroundColor: '#f87171', borderRadius: 6, borderSkipped: false },
    ]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: '#6b7280' }, stacked: true }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', stepSize: 1 }, stacked: true } }
  };

  const bestLang = langLabels.reduce((best, l) => {
    const rate = data.langStats[l].total > 0 ? data.langStats[l].success / data.langStats[l].total : 0;
    const bestRate = best ? (data.langStats[best].total > 0 ? data.langStats[best].success / data.langStats[best].total : 0) : -1;
    return rate > bestRate ? l : best;
  }, null);

  const streakMsg = streak === 0 ? 'No active streak — start coding today!' :
    streak === 1 ? "You're on a 1-day streak! Keep it up 🔥" :
    streak < 7 ? `${streak}-day streak — you're on fire! 🔥` :
    `${streak}-day streak — absolute legend! 🏆`;

  const badges = getBadges({
    successCount: data.uniqueSolvedCount, // Use unique solved for badges
    totalSubmissions: data.totalSubmissions,
    rank: data.rank,
    totalStudents: data.totalStudents,
    certificateCount: data.certificateCount,
    streak,
    solvedCount: data.uniqueSolvedCount,
  });

  return (
    <div className={`space-y-8 animate-fade-in-up ${loading ? 'opacity-60 transition-opacity' : ''}`}>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5 w-fit">
        <ArrowLeft size={16} /> Back
      </button>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My Progress</h1>
        <p className="text-gray-500 text-sm mt-1">Track your coding journey and growth</p>
      </div>

      {/* Level System */}
      <div className={`glass-card rounded-2xl p-4 sm:p-6 bg-gradient-to-br ${currentLevel.bg} border border-white/10`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentLevel.bg} flex items-center justify-center text-2xl sm:text-3xl shrink-0 border border-white/10`}>
              <Shield size={28} className={currentLevel.color} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Current Level</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 ${currentLevel.color}`}>Lv. {currentLevel.level}</span>
              </div>
              <p className={`text-2xl font-black ${currentLevel.color}`}>{currentLevel.label}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                      currentLevel.level === 1 ? 'from-gray-400 to-gray-500' :
                      currentLevel.level === 2 ? 'from-emerald-400 to-teal-500' :
                      currentLevel.level === 3 ? 'from-blue-400 to-cyan-500' :
                      currentLevel.level === 4 ? 'from-violet-400 to-purple-500' :
                      currentLevel.level === 5 ? 'from-amber-400 to-orange-500' :
                      'from-red-400 to-pink-500'
                    }`}
                    style={{ width: `${levelPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-400 shrink-0">{levelPct}%</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {nextLevel
                  ? `${points} / ${nextLevel.min} XP to reach ${nextLevel.label}`
                  : '🏆 Max level reached!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-3 border border-white/5">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{points}</p>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Total XP</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{currentLevel.level}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: <Trophy size={20} />, label: 'Points', value: points, ic: 'text-amber-400', bg: 'from-amber-500/15 to-orange-500/5' },
          { icon: <Hash size={20} />, label: 'Rank', value: `#${data.rank}`, ic: 'text-primary-light', bg: 'from-primary/15 to-accent/5' },
          { icon: <Target size={20} />, label: 'Submissions', value: data.totalSubmissions, ic: 'text-blue-400', bg: 'from-blue-500/15 to-cyan-500/5' },
          { icon: <CheckCircle2 size={20} />, label: 'Solved', value: data.uniqueSolvedCount, ic: 'text-emerald-400', bg: 'from-emerald-500/15 to-teal-500/5' },
          { icon: <Flame size={20} />, label: 'Success Rate', value: `${successRate}%`, ic: 'text-orange-400', bg: 'from-orange-500/15 to-red-500/5' },
          { icon: <Award size={20} />, label: 'Certificates', value: data.certificateCount, ic: 'text-violet-400', bg: 'from-violet-500/15 to-purple-500/5' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 text-center space-y-2">
            <div className={`bg-gradient-to-br ${s.bg} w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${s.ic}`}>{s.icon}</div>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Streak + Goal + Most Active Day */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Streak Widget */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 transition-all ${
            streak >= 7 ? 'bg-amber-500/20' : streak >= 3 ? 'bg-orange-500/20' : streak >= 1 ? 'bg-red-500/15' : 'bg-white/5'
          }`}>
            {streak >= 1 ? '🔥' : '💤'}
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-0.5">Daily Streak</p>
            <p className="text-2xl sm:text-3xl font-black">{streak} <span className="text-base font-semibold text-gray-500">{streak === 1 ? 'day' : 'days'}</span></p>
            <p className="text-xs text-gray-400 mt-1">{streakMsg}</p>
            <div className="flex gap-1 mt-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < streak ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-white/10'}`} />
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-1">7-day target</p>
          </div>
        </div>

        {/* Goal Tracker */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 flex items-center gap-5">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="url(#ringGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(goalPct / 100) * 94.25} 94.25`} />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-white">{goalPct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-0.5">Goal Tracker</p>
            <p className="text-lg font-black">{data.successCount} / {Math.max(data.successCount, totalAssignments)} <span className="text-sm font-semibold text-gray-500">solved</span></p>
            <p className="text-xs text-gray-400 mt-1">
              {goalPct === 100 ? '🏆 All assignments completed! Amazing work!' :
               goalPct >= 75 ? '⚡ Almost there—keep pushing!' :
               goalPct >= 50 ? '📈 Halfway through—great momentum!' :
               goalPct >= 25 ? '🚀 Good start! Keep solving to climb!' :
               '🎯 Begin your journey by solving your first assignment!'}
            </p>
          </div>
        </div>

        {/* Most Active Day */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar size={28} className="text-primary-light" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-0.5">Most Active Day</p>
            {mostActiveDay && mostActiveDay.count > 0 ? (
              <>
                <p className="text-2xl font-black text-white">{mostActiveDay.day}</p>
                <p className="text-xs text-gray-400 mt-1">{mostActiveDay.count} submission{mostActiveDay.count !== 1 ? 's' : ''} this day (last 7 days)</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black text-gray-500">—</p>
                <p className="text-xs text-gray-600 mt-1">No submissions in the last 7 days</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Medal size={18} className="text-amber-400" />
          <h3 className="font-bold">Achievement Badges</h3>
          <span className="text-xs text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-lg ml-1">{badges.length} earned</span>
        </div>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges.map((b, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${b.color} transition-all hover:-translate-y-0.5`}>
                <span className="text-2xl shrink-0">{b.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{b.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 sm:py-8">
            <Sparkles size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Solve your first assignment to start earning badges!</p>
          </div>
        )}
        {/* Locked badges hint */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-px bg-white/5"></div>
          <p className="text-[10px] text-gray-600 font-medium">Keep solving to unlock more achievements</p>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card rounded-2xl p-4 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={18} className="text-primary-light" />
            <h3 className="font-bold">Weekly Activity</h3>
          </div>
          <div className="h-48">
            <Bar data={weeklyData} options={{ ...chartOpts, scales: { ...chartOpts.scales, x: { ...chartOpts.scales.x, stacked: false }, y: { ...chartOpts.scales.y, stacked: false } } }} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Code2 size={18} className="text-primary-light" />
            <h3 className="font-bold">By Language</h3>
          </div>
          <div className="h-48">
            {langLabels.length > 0 ? (
              <Bar data={langData} options={chartOpts} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">No submissions yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Language Proficiency Summary */}
      {langLabels.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary-light" />
            <h3 className="font-bold">Language Proficiency</h3>
          </div>
          <div className="space-y-3">
            {langLabels.map(lang => {
              const s = data.langStats[lang];
              const rate = s.total > 0 ? Math.round((s.success / s.total) * 100) : 0;
              const isBest = lang === bestLang;
              return (
                <div key={lang} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <span className="text-sm font-bold text-white">{lang}</span>
                    {isBest && <Star size={12} className="text-amber-400" fill="currentColor" />}
                  </div>
                  <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 w-14 text-right">{rate}% ({s.success}/{s.total})</span>
                </div>
              );
            })}
          </div>
          {bestLang && (
            <p className="text-xs text-gray-500 pt-1 flex items-center gap-1">
              <Star size={11} className="text-amber-400" fill="currentColor" /> Your strongest language is <span className="font-bold text-white ml-1">{bestLang}</span>
            </p>
          )}
        </div>
      )}

      {/* Rank Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-8 flex items-center gap-4 sm:gap-6">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center">
          <TrendingUp size={28} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">Your Ranking</h3>
          <p className="text-gray-400 text-sm mt-1">
            You are ranked <span className="font-bold text-white">#{data.rank}</span> out of <span className="font-bold text-white">{data.totalStudents}</span> students.
            {data.rank === 1 && " 🏆 You're at the top!"}
            {data.rank > 1 && data.rank <= 3 && " 🥇 Amazing work!"}
            {data.rank > 3 && " Keep going to climb the leaderboard!"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl sm:text-4xl font-black gradient-text">#{data.rank}</p>
          <p className="text-xs text-gray-500">of {data.totalStudents}</p>
        </div>
      </div>

      {/* Recent Submissions */}
      {data.recentSubmissions?.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/5">
            <h3 className="font-bold flex items-center gap-2"><Target size={18} className="text-primary-light" /> Recent Submissions</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.recentSubmissions.map((s, i) => (
              <div key={i} className="flex items-center p-4 px-4 sm:px-6 hover:bg-white/[0.02] transition-colors">
                {s.status === 'Success' ? <CheckCircle2 size={16} className="text-emerald-400 mr-3" /> : <XCircle size={16} className="text-red-400 mr-3" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.assignments?.title || 'Assignment'}</p>
                  <p className="text-[11px] text-gray-500">{new Date(s.submitted_at).toLocaleString()}</p>
                </div>
                <span className="text-xs text-gray-500">{s.language}</span>
                {s.status === 'Success' && s.assignments?.points && (
                  <span className="ml-3 text-xs font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg">+{s.assignments.points}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
