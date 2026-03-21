import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight, PlayCircle, Code2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Fetch profile to get role for redirect
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          if (profile.role === 'Educator') navigate('/educator/dashboard');
          else if (profile.role === 'Student') navigate('/student/dashboard');
          else if (profile.role === 'Admin') navigate('/admin');
          else navigate('/');
        } else {
          navigate('/');
        }
      } catch {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="gradient-blob"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="glass-card rounded-3xl p-4 sm:p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 pr-12 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center"><span className="bg-card px-4 text-xs text-gray-600">or</span></div>
          </div>

          <Link to="/playground" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <PlayCircle size={16} /> Try the Playground (no account needed)
          </Link>

          <p className="text-center text-sm text-gray-500">
            New here?{' '}
            <Link to="/register" className="text-primary-light font-semibold hover:text-accent transition-colors">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
