import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import {
  LayoutDashboard, Users, BookOpen, FileCheck, Megaphone,
  Shield, Search, Trash2, ChevronDown, ChevronUp, TrendingUp,
  CheckCircle2, XCircle, Loader2, Send, AlertTriangle, Eye,
  Rocket, Save, RefreshCw, Edit2, Key, Award
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TABS = [
  { id: 'overview',     label: 'Overview',      icon: LayoutDashboard },
  { id: 'users',        label: 'Users',          icon: Users           },
  { id: 'assignments',  label: 'Assignments',    icon: BookOpen        },
  { id: 'submissions',  label: 'Submissions',    icon: FileCheck       },
  { id: 'certificates', label: 'Certificates',   icon: Award           },
  { id: 'announcements',label: 'Announcements',  icon: Megaphone       },
];

const ROLE_COLORS = {
  Admin:    'bg-red-500/10 text-red-400',
  Educator: 'bg-violet-500/10 text-violet-400',
  Student:  'bg-blue-500/10 text-blue-400',
};

function useAdminData(tab) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      // Only set loading true if we don't have data for this tab yet
      if (!data) setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        const h = { Authorization: `Bearer ${session.access_token}` };
        const urls = {
          overview:      '/admin/stats',
          users:         '/admin/users',
          assignments:   '/admin/assignments',
          submissions:   '/admin/submissions',
          certificates:  '/admin/certificates',
          announcements: '/announcements',
        };
        const res = await fetch(`${import.meta.env.VITE_API_URL}${urls[tab]}`, { headers: h });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch { /* handled */ }
      if (isMounted) setLoading(false);
    };

    load();
    return () => { isMounted = false; };
  }, [tab]);

  return { data, loading, reload: () => { setData(null); } }; // reset data for a hard reload if requested
}

// ──── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  if (!data) return null;
  const stats = [
    { label: 'Total Users',       value: data.totalUsers,       color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { label: 'Students',          value: data.studentCount,     color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
    { label: 'Educators',         value: data.educatorCount,    color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Assignments',       value: data.totalAssignments, color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
    { label: 'Total Submissions', value: data.totalSubmissions, color: 'text-primary-light', bg: 'bg-primary/10' },
    { label: 'Passed',            value: data.successCount,     color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
    { label: 'Failed',            value: data.failCount,        color: 'text-red-400',    bg: 'bg-red-500/10'    },
    { label: 'Today',             value: data.todaySubmissions, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];
  const passRate = data.totalSubmissions ? Math.round((data.successCount / data.totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`glass-card rounded-2xl p-5 space-y-2 border border-white/5`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value ?? '—'}</p>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pass rate bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-300">Platform Pass Rate</p>
          <p className="text-lg font-black text-emerald-400">{passRate}%</p>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
            style={{ width: `${passRate}%` }} />
        </div>
      </div>

      {/* 7-day chart */}
      {data.submissionsPerDay?.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-light" /> Submissions — Last 7 Days
          </p>
          <div className="h-40">
            <Bar
              data={{
                labels: data.submissionsPerDay.map(d => d.day),
                datasets: [{ label: 'Submissions', data: data.submissionsPerDay.map(d => d.count), backgroundColor: '#818cf8', borderRadius: 6, borderSkipped: false }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', stepSize: 1 } } } }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ──── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab({ data, reload }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [changingRole, setChangingRole] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', department: '', academic_year: '', total_points: '' });
  const [resettingPw, setResettingPw] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (u) => {
    setEditingUser(u.id);
    setEditForm({ name: u.name, department: u.department || '', academic_year: u.academic_year || '', total_points: u.total_points || 0 });
  };
  
  const saveEdit = async () => {
    setSavingEdit(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${editingUser}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(editForm)
    });
    setEditingUser(null);
    setSavingEdit(false);
    reload();
  };

  const resetPassword = async (userId) => {
    if (!confirm('Reset password to "gyancode123"?')) return;
    setResettingPw(userId);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ newPassword: 'gyancode123' })
    });
    setResettingPw(null);
    alert('Password reset to gyancode123');
  };

  const filtered = (data || []).filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    const matchR = roleFilter === 'All' || u.role === roleFilter;
    return matchQ && matchR;
  });

  const changeRole = async (userId, newRole) => {
    setChangingRole(userId);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ role: newRole })
    });
    setChangingRole(null);
    reload();
  };

  const deleteUser = async (userId) => {
    if (!confirm('Permanently delete this user and all their data?')) return;
    setDeleting(userId);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    setDeleting(null);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
            placeholder="Search name, email, department..." />
        </div>
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
          {['All', 'Student', 'Educator', 'Admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === r ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 self-center">{filtered.length} users</span>
      </div>

      <div className="glass-card rounded-2xl overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-gray-600 tracking-wider border-b border-white/5">
              <th className="text-left p-4 pl-6">User</th>
              <th className="text-left p-4">Department</th>
              <th className="text-center p-4">Year</th>
              <th className="text-center p-4">Points</th>
              <th className="text-center p-4">Role</th>
              <th className="text-center p-4">Joined</th>
              <th className="text-right p-4 pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.015] transition-colors">
                {editingUser === u.id ? (
                  <>
                    <td className="p-4 pl-6">
                      <input className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                      <p className="text-[11px] text-gray-500 mt-1">{u.email}</p>
                    </td>
                    <td className="p-4"><input className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="Dept" /></td>
                    <td className="p-4 text-center"><input className="w-16 mx-auto bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:outline-none" value={editForm.academic_year} onChange={e => setEditForm({...editForm, academic_year: e.target.value})} placeholder="Year" /></td>
                    <td className="p-4 text-center"><input type="number" className="w-16 mx-auto bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:outline-none" value={editForm.total_points} onChange={e => setEditForm({...editForm, total_points: e.target.value})} placeholder="Pts" /></td>
                    <td className="p-4 text-center"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${ROLE_COLORS[u.role] || 'bg-white/5 text-gray-400'}`}>{u.role}</span></td>
                    <td className="p-4 text-center text-[11px] text-gray-500">{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                      <button onClick={saveEdit} disabled={savingEdit} className="text-emerald-400 text-xs font-bold mr-3 hover:underline disabled:opacity-50">{savingEdit ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingUser(null)} disabled={savingEdit} className="text-gray-400 text-xs hover:underline disabled:opacity-50">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 pl-6">
                      <Link to={`/educator/student/${u.id}`} className="font-semibold text-sm hover:text-primary-light transition-colors">{u.name}</Link>
                      <p className="text-[11px] text-gray-500">{u.email}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{u.department || '—'}</td>
                    <td className="p-4 text-center text-sm text-gray-400">{u.academic_year || '—'}</td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-bold text-amber-400">{u.total_points || 0}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${ROLE_COLORS[u.role] || 'bg-white/5 text-gray-400'}`}>{u.role}</span>
                        {changingRole === u.id ? <Loader2 size={12} className="animate-spin text-gray-500" /> : (
                          <select
                            value={u.role}
                            onChange={e => changeRole(u.id, e.target.value)}
                            className="bg-transparent border-none text-[10px] text-gray-600 cursor-pointer hover:text-white transition-colors outline-none ml-1"
                            title="Change role">
                            <option className="bg-card" value="Student">Student</option>
                            <option className="bg-card" value="Educator">Educator</option>
                            <option className="bg-card" value="Admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center text-[11px] text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="p-4 pr-6 text-right whitespace-nowrap flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(u)} className="p-2 hover:bg-white/5 rounded-lg text-gray-600 hover:text-white transition-all" title="Edit profile">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => resetPassword(u.id)} disabled={resettingPw === u.id} className="p-2 hover:bg-amber-500/10 rounded-lg text-gray-600 hover:text-amber-400 transition-all disabled:opacity-50" title="Reset password">
                        {resettingPw === u.id ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                      </button>
                      <button onClick={() => deleteUser(u.id)} disabled={deleting === u.id} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-400 transition-all disabled:opacity-50" title="Delete user">
                        {deleting === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-gray-600">No users found.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ──── Assignments Tab ─────────────────────────────────────────────────────────
function AssignmentsTab({ data, reload }) {
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = (data || []).filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.users?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const togglePublish = async (id, current) => {
    setToggling(id);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/assignments/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ is_published: !current })
    });
    setToggling(null);
    reload();
  };

  const deleteAssignment = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    setDeleting(id);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/assignments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    setDeleting(null);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
            placeholder="Search title or educator..." />
        </div>
        <span className="text-xs self-center text-gray-500">{filtered.length} assignments</span>
      </div>

      <div className="glass-card rounded-2xl overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-gray-600 tracking-wider border-b border-white/5">
              <th className="text-left p-4 pl-6">Assignment</th>
              <th className="text-left p-4">Educator</th>
              <th className="text-center p-4">Level</th>
              <th className="text-center p-4">Points</th>
              <th className="text-center p-4">Status</th>
              <th className="text-center p-4">Created</th>
              <th className="text-right p-4 pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-white/[0.015] transition-colors">
                <td className="p-4 pl-6">
                  <Link to={`/educator/assignment/${a.id}`} className="font-semibold text-sm hover:text-primary-light transition-colors block">{a.title}</Link>
                  <p className="text-[11px] text-gray-500">{a.language}</p>
                </td>
                <td className="p-4 text-sm text-gray-400">
                  {a.created_by ? <Link to={`/educator/student/${a.created_by}`} className="hover:text-primary-light transition-colors">{a.users?.name}</Link> : '—'}
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                    a.proficiency_level === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                    a.proficiency_level === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{a.proficiency_level}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-xs font-bold text-amber-400">{a.points}</span>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => togglePublish(a.id, a.is_published)} disabled={toggling === a.id}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 mx-auto transition-all hover:scale-105 disabled:opacity-50 ${
                      a.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                    {toggling === a.id ? <Loader2 size={10} className="animate-spin" /> : a.is_published ? <><Rocket size={10} />Live</> : <><Save size={10} />Draft</>}
                  </button>
                </td>
                <td className="p-4 text-center text-[11px] text-gray-500">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 pr-6 text-right">
                  <button onClick={() => deleteAssignment(a.id)} disabled={deleting === a.id}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-400 transition-all disabled:opacity-50">
                    {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-gray-600">No assignments found.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ──── Submissions Tab ─────────────────────────────────────────────────────────
function SubmissionsTab({ data }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const filtered = (data || []).filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.users?.name?.toLowerCase().includes(q) || s.assignments?.title?.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || s.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
            placeholder="Search student or assignment..." />
        </div>
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
          {['All', 'Success', 'Failed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s
                  ? s === 'Success' ? 'bg-emerald-500/15 text-emerald-400'
                    : s === 'Failed' ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
        <span className="text-xs self-center text-gray-500">{filtered.length} results</span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.03]">
        {filtered.map((s, i) => (
          <div key={s.id}>
            <div className="flex items-center p-4 px-4 sm:px-6 hover:bg-white/[0.015] cursor-pointer transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}>
              {s.status === 'Success'
                ? <CheckCircle2 size={16} className="text-emerald-400 mr-3 shrink-0" />
                : <XCircle size={16} className="text-red-400 mr-3 shrink-0" />}
              <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                <p className="font-semibold text-sm">
                  {s.user_id ? <Link to={`/educator/student/${s.user_id}`} className="hover:text-primary-light transition-colors">{s.users?.name || '—'}</Link> : (s.users?.name || '—')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {s.assignment_id ? <Link to={`/educator/assignment/${s.assignment_id}`} className="hover:text-primary-light transition-colors">{s.assignments?.title || 'Unknown Assignment'}</Link> : (s.assignments?.title || 'Unknown Assignment')}
                </p>
              </div>
              <span className="text-[10px] text-gray-500 mr-4 shrink-0">
                {s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg mr-2 shrink-0 ${
                s.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>{s.status}</span>
              {expanded === i ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
            </div>
            {expanded === i && (
              <div className="p-4 sm:p-6 bg-white/[0.01] border-t border-white/5">
                <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-60">{s.code || '(no code)'}</pre>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="p-10 text-center text-gray-600">No submissions found.</div>}
      </div>
    </div>
  );
}

// ──── Announcements Tab ───────────────────────────────────────────────────────
function AnnouncementsTab({ data, reload }) {
  const [form, setForm] = useState({ title: '', body: '' });
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!form.title.trim()) return;
    setPosting(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(import.meta.env.VITE_API_URL + '/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(form)
    });
    setForm({ title: '', body: '' });
    setPosting(false);
    reload();
  };

  const del = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/announcements/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` }
    });
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-3">
        <p className="text-sm font-bold text-gray-300">Post New Announcement</p>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:bg-white/[0.07] transition-all"
          placeholder="Announcement title..." />
        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:bg-white/[0.07] transition-all resize-none"
          placeholder="Optional details..." />
        <button onClick={post} disabled={posting || !form.title.trim()}
          className="btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
          {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Post
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.03]">
        {(data || []).length === 0 && <div className="p-10 text-center text-gray-600">No announcements yet.</div>}
        {(data || []).map(a => (
          <div key={a.id} className="flex items-start gap-4 p-5 px-4 sm:px-6 group hover:bg-white/[0.015] transition-colors">
            <Megaphone size={16} className="text-violet-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{a.title}</p>
              {a.body && <p className="text-xs text-gray-500 mt-1">{a.body}</p>}
              <p className="text-[10px] text-gray-600 mt-1">{new Date(a.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => del(a.id)}
              className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──── Certificates Tab ────────────────────────────────────────────────────────
function CertificatesTab({ data, reload }) {
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const filtered = (data || []).filter(c => 
    !search || 
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.awarded_to_user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.issued_by_user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const del = async (id) => {
    if (!confirm('Permanently delete this certificate?')) return;
    setDeleting(id);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/admin/certificates/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` }
    });
    setDeleting(null);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
            placeholder="Search title or user..." />
        </div>
        <span className="text-xs self-center text-gray-500">{filtered.length} certificates</span>
      </div>

      <div className="glass-card rounded-2xl overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold uppercase text-gray-600 tracking-wider border-b border-white/5">
                <th className="text-left p-4 pl-6">Certificate & Assignment ID</th>
                <th className="text-left p-4">Awarded To</th>
                <th className="text-left p-4">Issued By</th>
                <th className="text-center p-4">Issued On</th>
                <th className="text-right p-4 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-semibold text-sm text-amber-400 flex items-center gap-2"><Award size={14} />{c.title}</p>
                    {c.awarded_for_assignment && <p className="text-[11px] text-gray-500 mt-1">ID: {c.awarded_for_assignment}</p>}
                  </td>
                  <td className="p-4">
                    <Link to={`/educator/student/${c.awarded_to}`} className="text-sm font-semibold hover:text-primary-light transition-colors block">{c.awarded_to_user?.name || '—'}</Link>
                    <p className="text-[11px] text-gray-500">{c.awarded_to_user?.email}</p>
                  </td>
                  <td className="p-4">
                    {c.issued_by ? (
                      <>
                        <Link to={`/educator/student/${c.issued_by}`} className="text-sm font-semibold hover:text-primary-light transition-colors block">{c.issued_by_user?.name || '—'}</Link>
                        <p className="text-[11px] text-gray-500">{c.issued_by_user?.email}</p>
                      </>
                    ) : <span className="text-sm text-gray-400">System</span>}
                  </td>
                  <td className="p-4 text-center text-sm text-gray-400">
                    {new Date(c.issued_on).toLocaleDateString()}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button onClick={() => del(c.id)} disabled={deleting === c.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-400 transition-all disabled:opacity-50">
                      {deleting === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-gray-600">No certificates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──── Main AdminPanel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  
  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const { data, loading, reload } = useAdminData(tab);

  return (
    <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/10 p-3 rounded-2xl">
              <Shield size={26} className="text-red-400" />
            </div>
            Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-14">System-wide control & oversight</p>
        </div>
        <button onClick={reload} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-300 text-sm">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
        <p>Admin actions are <strong>permanent</strong>. Deleting users or assignments cannot be undone.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.03] p-1.5 rounded-2xl overflow-x-auto custom-scrollbar">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
                tab === t.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {!data && loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
        </div>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          {tab === 'overview'      && <OverviewTab data={data} />}
          {tab === 'users'         && <UsersTab data={data} reload={reload} />}
          {tab === 'assignments'   && <AssignmentsTab data={data} reload={reload} />}
          {tab === 'submissions'   && <SubmissionsTab data={data} />}
          {tab === 'certificates'  && <CertificatesTab data={data} reload={reload} />}
          {tab === 'announcements' && <AnnouncementsTab data={data} reload={reload} />}
        </div>
      )}
    </div>
  );
}
