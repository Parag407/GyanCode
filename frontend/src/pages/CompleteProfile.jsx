import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, BookOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const [form, setForm] = useState({ role: 'Student', academic_year: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let resolved = false;

    // 1. Try getSession immediately (works if session already stored)
    const tryGetSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !resolved) {
        resolved = true;
        setToken(session.access_token);
        const name = session.user?.user_metadata?.full_name
          || session.user?.user_metadata?.name
          || '';
        setUserName(name);
        setSessionLoading(false);
      }
    };

    tryGetSession();

    // 2. Also listen via onAuthStateChange — fires once OAuth hash is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !resolved) {
        resolved = true;
        setToken(session.access_token);
        const name = session.user?.user_metadata?.full_name
          || session.user?.user_metadata?.name
          || '';
        setUserName(name);
        setSessionLoading(false);
      } else if (!session && !resolved) {
        // No session after auth change — send to login
        resolved = true;
        setSessionLoading(false);
        navigate('/login');
      }
    });

    // 3. Timeout fallback — if session never arrives
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setSessionLoading(false);
        navigate('/login');
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError('Session expired. Please sign in again.'); return; }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName || 'User',
          role: form.role,
          academic_year: form.academic_year,
          department: form.department,
        }),
      });

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        setError(resData.error || `Server error (${response.status}). Please try again.`);
        setLoading(false);
        return;
      }

      navigate(form.role === 'Educator' ? '/educator/dashboard' : '/student/dashboard');
    } catch (err) {
      console.error('[CompleteProfile] Fetch error:', err);
      setError(`Network error: ${err.message}. Check your connection or try again.`);
      setLoading(false);
    }
  };

  // While waiting for session to be established after OAuth redirect
  if (sessionLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-primary-light mx-auto" />
          <p className="text-gray-500 text-sm">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="gradient-blob"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-7">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/30 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">One Last Step!</h2>
            <p className="text-gray-500 text-sm">
              {userName ? `Welcome, ${userName.split(' ')[0]}! ` : ''}Tell us about yourself to personalize your experience.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">I am joining as</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'Student', emoji: '🎓', desc: 'Learn & solve challenges' },
                  { role: 'Educator', emoji: '📚', desc: 'Create & manage assignments' },
                ].map(({ role: r, emoji, desc }) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.role === r
                        ? 'bg-primary/15 border-primary/40 text-primary-light shadow-lg shadow-primary/10'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/[0.07] hover:border-white/20'
                    }`}>
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="text-sm font-bold">{r}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Academic details */}
            <div className={`grid gap-3 ${form.role === 'Student' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {form.role === 'Student' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={11} /> Academic Year
                  </label>
                  <select name="academic_year" value={form.academic_year} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                    <option value="" className="bg-card">Select year</option>
                    {['FY', 'SY', 'TY', 'Final Year'].map(y => <option key={y} value={y} className="bg-card">{y}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={11} /> Department
                </label>
                <select name="department" value={form.department} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                  <option value="" className="bg-card">Select dept.</option>
                  {['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Other'].map(d =>
                    <option key={d} value={d} className="bg-card">{d}</option>
                  )}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading || !token}
              className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={16} /> Complete Setup</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
