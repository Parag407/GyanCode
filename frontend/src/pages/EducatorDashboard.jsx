import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { LogOut, Code2, LayoutDashboard, FilePlus, Trophy, History, Award, User, ChevronDown, Bot, PlayCircle, TrendingUp, Megaphone, Swords, Shield, Search, Users, ExternalLink, FileCheck, Zap, ArrowRight, Send, Trash2, Tag, Loader2, Rocket, Save, CalendarClock, Eye, Pencil, Copy, Download, FileSpreadsheet } from 'lucide-react';
import { generateExcelReport } from '../utils/reportGenerator';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function EducatorDashboard({ settings = {}, profile }) {
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '' });
  const [posting, setPosting] = useState(false);
  const [cloning, setCloning] = useState(null);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMounted) return;
      const token = session.access_token;

      try {
        const [statsRes, assignRes, announcementsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/announcements`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (!isMounted) return;

        if (statsRes.ok) setStats(await statsRes.json());
        if (assignRes.ok) setAssignments(await assignRes.json());
        if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      } catch (err) {
        console.error("EducatorDashboard Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
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

  const handlePostAnnouncement = async () => {
    if (!announcementForm.title.trim()) return;
    setPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(announcementForm),
    });
    if (res.ok) {
      const ann = await res.json();
      setAnnouncements([ann, ...announcements]);
      setAnnouncementForm({ title: '', body: '' });
    }
    setPosting(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/announcements/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const topStudents = (stats?.students || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0)).slice(0, 5);

  const barData = {
    labels: topStudents.map(s => s.name),
    datasets: [{
      label: 'Points',
      data: topStudents.map(s => s.total_points || 0),
      backgroundColor: ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'],
      borderRadius: 8, borderSkipped: false,
    }]
  };

  const doughnutData = {
    labels: ['Passed', 'Failed'],
    datasets: [{
      data: [stats?.successCount || 0, stats?.failCount || 0],
      backgroundColor: ['#34d399', '#f87171'],
      borderWidth: 0, spacing: 4,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' } } }
  };

  // Soft loading check
  const isDataReady = !loading || !!stats;

  return (
    <div className={`space-y-8 animate-fade-in-up ${loading ? 'opacity-60 transition-opacity' : ''}`}>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Educator Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor class performance at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={!isDataReady}
            onClick={() => generateExcelReport({ ...stats, assignments }, 'Educator_System_Report')}
            className="bg-white/5 border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50">
            <FileSpreadsheet size={16} /> Export to Excel
          </button>

          {(settings.educator_create_assignments_enabled !== false || profile?.role === 'Admin') && (
            <Link to="/educator/create-assignment" className="btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
              <FilePlus size={16} /> New Assignment
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {!isDataReady ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-white/5"></div>
          ))
        ) : (
          [
            { icon: <Users size={22} />, label: 'Students', value: stats?.studentCount, color: 'from-blue-500/15 to-cyan-500/5', ic: 'text-blue-400' },
            { icon: <FileCheck size={22} />, label: 'Submissions', value: stats?.submissionCount, color: 'from-violet-500/15 to-purple-500/5', ic: 'text-violet-400' },
            { icon: <Trophy size={22} />, label: 'Pass Rate', value: stats?.submissionCount ? Math.round((stats.successCount / stats.submissionCount) * 100) + '%' : 'N/A', color: 'from-emerald-500/15 to-teal-500/5', ic: 'text-emerald-400' },
            { icon: <TrendingUp size={22} />, label: 'Assignments', value: stats?.assignmentCount, color: 'from-amber-500/15 to-orange-500/5', ic: 'text-amber-400' },
            { icon: <Zap size={22} />, label: 'Active Today', value: stats?.activeStudentsToday ?? '—', color: 'from-red-500/15 to-pink-500/5', ic: 'text-red-400' },
          ].map((s, i) => (
            <div key={i} className="glass-card stat-card rounded-2xl p-4 sm:p-6 space-y-3">
              <div className={`bg-gradient-to-br ${s.color} w-11 h-11 rounded-xl flex items-center justify-center ${s.ic}`}>{s.icon}</div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))
        )}
      </div>

      {/* 7-Day Submissions Trend */}
      {stats?.submissionsPerDay?.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary-light" />
            <h3 className="text-sm font-bold">Submissions – Last 7 Days</h3>
          </div>
          <div className="h-36">
            <Bar
              data={{
                labels: stats.submissionsPerDay.map(d => d.day),
                datasets: [{ label: 'Submissions', data: stats.submissionsPerDay.map(d => d.count), backgroundColor: '#818cf8', borderRadius: 6, borderSkipped: false }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', stepSize: 1 } } } }}
            />
          </div>
        </div>
      )}

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Charts */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 glass-card rounded-2xl p-4 sm:p-8">
            <h3 className="text-lg font-bold mb-6">Top Performers</h3>
            <div className="h-64"><Bar data={barData} options={chartOpts} /></div>
          </div>
          <div className="glass-card rounded-2xl p-4 sm:p-8">
            <h3 className="text-lg font-bold mb-6">Execution Results</h3>
            <div className="h-52 flex items-center justify-center">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 16, font: { size: 10 } } } }, cutout: '65%' }} />
            </div>
            <div className="flex justify-center gap-4 sm:gap-6 mt-4">
              <div className="text-center"><p className="text-xl font-black text-emerald-400">{stats?.successCount}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Passed</p></div>
              <div className="text-center"><p className="text-xl font-black text-red-400">{stats?.failCount}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Failed</p></div>
            </div>
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2"><TrendingUp size={15} className="text-primary-light" /> Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-white/[0.03]">
            {(stats?.submissions || []).slice(0, 10).map((sub, i) => (
              <Link key={i} to={`/educator/assignment/${sub.assignment_id}`} className="p-4 hover:bg-white/[0.04] transition-colors group block">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${sub.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {sub.status === 'Success' ? <FileCheck size={13} /> : <TrendingUp size={13} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-300 group-hover:text-primary-light transition-colors truncate">{sub.users?.name || 'Student'}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{sub.assignments?.title || 'Assignment'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className={`text-[9px] font-black uppercase tracking-wider ${sub.status === 'Success' ? 'text-emerald-500/60' : 'text-red-500/60'}`}>{sub.status}</p>
                      <span className="text-[10px] text-gray-700">•</span>
                      <p className="text-[9px] text-gray-600 font-bold">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-gray-700 group-hover:text-primary-light transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1 mt-1" />
                </div>
              </Link>
            ))}
            {(!stats?.submissions || stats.submissions.length === 0) && (
              <div className="p-4 sm:p-8 text-center"><p className="text-[11px] text-gray-600">No recent activity.</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center gap-2">
          <Megaphone size={18} className="text-violet-400" />
          <h3 className="text-lg font-bold">Announcements</h3>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {(settings.educator_post_announcements_enabled !== false || profile?.role === 'Admin') && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Announcement title..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:bg-white/[0.07] transition-all" />
                <input value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                  placeholder="Optional details..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:bg-white/[0.07] transition-all" />
              </div>
              <button onClick={handlePostAnnouncement} disabled={posting || !announcementForm.title.trim()}
                className="btn-primary px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 self-start mt-0">
                <Send size={14} /> Post
              </button>
            </div>
          )}
          {announcements.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] group transition-colors">
                  <Megaphone size={14} className="text-violet-400 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.title}</p>
                    {a.body && <p className="text-xs text-gray-500 mt-0.5">{a.body}</p>}
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(a.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-600 text-center py-4">No announcements yet.</p>}
        </div>
      </div>

      {/* My Assignments */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 shrink-0"><Award size={18} className="text-primary-light" /> My Assignments</h3>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text" value={assignmentSearch} onChange={e => setAssignmentSearch(e.target.value)}
              placeholder="Filter assignments..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{assignments.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <th className="text-left p-4 pl-6">Title</th>
                <th className="text-left p-4">Language</th>
                <th className="text-left p-4">Level</th>
                <th className="text-left p-4">Category</th>
                <th className="text-center p-4">Points</th>
                <th className="text-center p-4">Subs</th>
                <th className="text-center p-4">Status</th>
                <th className="text-center p-4">Deadline</th>
                <th className="text-right p-4 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.filter(a => !assignmentSearch || a.title.toLowerCase().includes(assignmentSearch.toLowerCase())).map(a => {
                const passRate = a.submission_count ? Math.round((a.success_count / a.submission_count) * 100) : 0;
                const isExpired = a.deadline && new Date(a.deadline) < new Date();
                return (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-400 capitalize">{a.language}</td>
                    <td className="p-4 text-sm">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        a.proficiency_level === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                        a.proficiency_level === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>{a.proficiency_level}</span>
                    </td>
                    <td className="p-4 text-sm">
                      {a.category ? (
                        <span className="text-[11px] font-bold bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                          <Tag size={9} /> {a.category}
                        </span>
                      ) : <span className="text-[10px] text-gray-600">—</span>}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-lg">{a.points}</span>
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-sm text-gray-400">{a.submission_count || 0}</p>
                      {a.submission_count > 0 && <p className={`text-[9px] font-bold mt-0.5 ${passRate >= 70 ? 'text-emerald-500/60' : 'text-gray-500'}`}>{passRate}% pass</p>}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        disabled={toggling === a.id}
                        onClick={async () => {
                          setToggling(a.id);
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${a.id}/publish`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ is_published: !a.is_published })
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, is_published: updated.is_published } : x));
                          }
                          setToggling(null);
                        }}
                        title={a.is_published ? 'Click to unpublish' : 'Click to publish'}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 justify-center transition-all hover:scale-105 disabled:opacity-50 mx-auto ${
                          a.is_published ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        }`}>
                        {toggling === a.id ? <Loader2 size={10} className="animate-spin" /> : a.is_published ? <><Rocket size={10} />Live</> : <><Save size={10} />Draft</>}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      {a.deadline ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 justify-center ${
                          isExpired ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          <CalendarClock size={10} />
                          {isExpired ? 'Overdue' : new Date(a.deadline).toLocaleDateString()}
                        </span>
                      ) : <span className="text-[10px] text-gray-600">—</span>}
                    </td>
                    <td className="p-4 pr-6 text-right flex gap-1 justify-end">
                      <Link to={`/educator/assignment/${a.id}`}
                        className="p-2 hover:bg-primary/10 rounded-lg text-gray-500 hover:text-primary-light transition-all" title="View Submissions">
                        <Eye size={15} />
                      </Link>
                      <Link to={`/educator/edit-assignment/${a.id}`}
                        className="p-2 hover:bg-amber-500/10 rounded-lg text-gray-500 hover:text-amber-400 transition-all" title="Edit">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => handleClone(a.id)} disabled={cloning === a.id}
                        className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-500 hover:text-blue-400 transition-all disabled:opacity-50" title="Clone">
                        {cloning === a.id ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
                      </button>
                      <button onClick={() => handleExport(a.id, a.title)}
                        className="p-2 hover:bg-emerald-500/10 rounded-lg text-gray-500 hover:text-emerald-400 transition-all" title="Export Submissions (CSV)">
                        <Download size={15} />
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && (
                <tr><td colSpan="9" className="p-4 sm:p-8 text-center text-gray-600">No assignments created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Leaderboard */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <h3 className="text-lg font-bold">Student Leaderboard</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {topStudents.map((s, i) => (
            <div key={s.id} className="flex items-center p-4 px-4 sm:px-6 hover:bg-white/[0.02] transition-colors">
              <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center mr-4 ${
                i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'
              }`}>{i + 1}</span>
              <div className="flex-1">
                <Link to={`/educator/student/${s.id}`} className="font-semibold text-sm hover:text-primary-light transition-colors">{s.name}</Link>
                <p className="text-[11px] text-gray-500">{s.department || '—'}</p>
              </div>
              <span className="bg-primary/10 text-primary-light text-sm font-bold px-3 py-1 rounded-lg">{s.total_points || 0}</span>
            </div>
          ))}
          {topStudents.length === 0 && <div className="p-4 sm:p-8 text-center text-gray-600">No students enrolled yet.</div>}
        </div>
      </div>

      {/* Student Management */}
      <StudentManagement token={null} students={stats?.students || []} />
    </div>
  );
}

function StudentManagement({ students }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('points');

  const filtered = students
    .filter(s => {
      const q = search.toLowerCase();
      return !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'points') return (b.total_points || 0) - (a.total_points || 0);
      if (sortBy === 'solved') return (b.solved_count || 0) - (a.solved_count || 0);
      if (sortBy === 'attempted') return (b.attempted_count || 0) - (a.attempted_count || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold flex items-center gap-2 shrink-0">
          <Users size={18} className="text-blue-400" /> Student Management
          <span className="text-xs font-normal text-gray-500 ml-1">({students.length} enrolled)</span>
        </h3>
        <div className="flex gap-3 flex-1 max-w-md">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
              placeholder="Search students..." />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            <option className="bg-card" value="points">Sort: Points</option>
            <option className="bg-card" value="solved">Sort: Solved</option>
            <option className="bg-card" value="attempted">Sort: Attempted</option>
            <option className="bg-card" value="name">Sort: Name</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-gray-600 tracking-wider border-b border-white/5">
              <th className="text-left p-4 pl-6">#</th>
              <th className="text-left p-4">Student</th>
              <th className="text-left p-4">Department</th>
              <th className="text-center p-4">Year</th>
              <th className="text-center p-4">Points</th>
              <th className="text-center p-4">Attempted</th>
              <th className="text-center p-4">Solved</th>
              <th className="text-right p-4 pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.map((s, i) => (
              <tr key={s.id} className="hover:bg-white/[0.015] transition-colors">
                <td className="p-4 pl-6 text-sm text-gray-600 font-mono">{i + 1}</td>
                <td className="p-4">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-[11px] text-gray-500">{s.email}</p>
                </td>
                <td className="p-4 text-sm text-gray-400">{s.department || '—'}</td>
                <td className="p-4 text-center text-sm text-gray-400">{s.academic_year || '—'}</td>
                <td className="p-4 text-center">
                  <span className="text-sm font-bold text-amber-400">{s.total_points || 0}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-sm font-bold text-amber-400">{s.attempted_count || 0}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-sm font-bold text-emerald-400">{s.solved_count || 0}</span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center gap-3 justify-end">
                    <Link to={`/educator/student/${s.id}`}
                      className="text-[11px] font-bold text-primary-light hover:underline flex items-center gap-1">
                      View Profile
                    </Link>
                    <Link to={`/certificates?awarded_to=${s.id}`}
                      className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1">
                      <Award size={12} /> Award Cert
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-4 sm:p-8 text-center text-gray-600">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

