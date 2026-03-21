import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, Trophy, Target, Award, Hash, Calendar,
  CheckCircle2, XCircle, Code2, TrendingUp, User
} from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const h = { 'Authorization': `Bearer ${session.access_token}` };
        const [studentRes, profileRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/students/${id}`, { headers: h }),
          fetch(`${import.meta.env.VITE_API_URL}/profile`, { headers: h })
        ]);

        if (studentRes.ok) setData(await studentRes.json());
        if (profileRes.ok) setProfile(await profileRes.json());
      }
      setLoading(false);
    };
    fetchStudent();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Student not found.</div>;

  const { student, rank, totalStudents, submissions, certificates, successCount, uniqueAssignmentsSolved } = data;
  const passRate = submissions.length ? Math.round((successCount / submissions.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      {/* Student Info */}
      <div className="glass-card rounded-2xl p-4 sm:p-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-2xl font-black text-white">
            {student.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">{student.name}</h1>
                <p className="text-gray-500 text-sm">{student.email}</p>
              </div>
              {['Educator', 'Admin'].includes(profile?.role) && (
                <button 
                  onClick={() => navigate(`/certificates?awarded_to=${id}`)}
                  className="btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 w-fit"
                >
                  <Award size={16} /> Award Certificate
                </button>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              {student.department && <span className="text-[11px] font-semibold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg">{student.department}</span>}
              {student.academic_year && <span className="text-[11px] font-semibold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg">{student.academic_year}</span>}
              <span className="text-[11px] font-semibold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Calendar size={9} /> Joined {new Date(student.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: <Trophy size={18} />, label: 'Points', value: student.total_points || 0, color: 'text-amber-400', bg: 'from-amber-500/15 to-amber-600/5' },
          { icon: <TrendingUp size={18} />, label: 'Rank', value: `#${rank} of ${totalStudents}`, color: 'text-primary-light', bg: 'from-primary/15 to-primary/5' },
          { icon: <Target size={18} />, label: 'Solved', value: uniqueAssignmentsSolved, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-600/5' },
          { icon: <Hash size={18} />, label: 'Submissions', value: submissions.length, color: 'text-violet-400', bg: 'from-violet-500/15 to-violet-600/5' },
          { icon: <Award size={18} />, label: 'Certificates', value: certificates.length, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-600/5' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-2">
            <div className={`w-9 h-9 bg-gradient-to-br ${s.bg} rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pass Rate */}
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Pass Rate</p>
          <span className="text-sm font-black text-primary-light">{passRate}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${passRate}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span className="text-emerald-400">{successCount} passed</span>
          <span className="text-red-400">{submissions.length - successCount} failed</span>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center gap-2">
          <Code2 size={18} className="text-primary-light" />
          <h3 className="text-lg font-bold">Recent Submissions</h3>
          <span className="text-xs text-gray-500 ml-auto">{submissions.length} total</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {submissions.slice(0, 20).map(sub => (
            <div key={sub.id} className="flex items-center p-4 px-4 sm:px-6 hover:bg-white/[0.02] transition-colors">
              {sub.status === 'Success'
                ? <CheckCircle2 size={16} className="text-emerald-400 mr-3" />
                : <XCircle size={16} className="text-red-400 mr-3" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{sub.assignments?.title || 'Assignment'}</p>
                <p className="text-[11px] text-gray-500">{sub.language} • {new Date(sub.submitted_at).toLocaleString()}</p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                sub.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>{sub.status}</span>
            </div>
          ))}
          {submissions.length === 0 && <div className="p-4 sm:p-8 text-center text-gray-600">No submissions yet.</div>}
        </div>
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/5 flex items-center gap-2">
            <Award size={18} className="text-amber-400" />
            <h3 className="text-lg font-bold">Certificates</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {certificates.map(cert => (
              <div key={cert.id} className="flex items-center p-4 px-4 sm:px-6 gap-3">
                <Award size={16} className="text-amber-400" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{cert.title}</p>
                  <p className="text-[11px] text-gray-500">{new Date(cert.issued_on).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
