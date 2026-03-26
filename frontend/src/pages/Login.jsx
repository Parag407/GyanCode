import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, PlayCircle, KeyRound, MessageSquareCode } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkProfileAndRedirect = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (loginMethod === 'otp') {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          setError(error.message);
        } else {
          setOtpSent(true);
        }
        setLoading(false);
      } else {
        const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
        if (error) {
          setError(error.message);
          setLoading(false);
        } else if (data?.session) {
          checkProfileAndRedirect(data.session.access_token);
        }
      }
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data?.session) {
        checkProfileAndRedirect(data.session.access_token);
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

          <div className="flex bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => { setLoginMethod('password'); setOtpSent(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'password' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              Password
            </button>
            <button 
              onClick={() => { setLoginMethod('otp'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'otp' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              Email OTP
            </button>
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
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loginMethod === 'otp' && otpSent}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all disabled:opacity-50"
                  placeholder="you@example.com" />
              </div>
            </div>

            {loginMethod === 'password' && (
              <div className="space-y-1.5 relative animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <Link to="/reset-password" className="text-xs text-primary-light hover:underline font-semibold text-right">Forgot?</Link>
                </div>
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
            )}

            {loginMethod === 'otp' && otpSent && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">6-Digit Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all tracking-widest font-mono text-center"
                    placeholder="000000" />
                </div>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="text-xs text-primary-light hover:underline mt-2 inline-block">Use different email</button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4">
              {loading ? (loginMethod === 'otp' && !otpSent ? 'Sending...' : 'Signing in...') : 
               (loginMethod === 'otp' && !otpSent ? <><MessageSquareCode size={16} /> Send Code</> : <><LogIn size={16} /> Sign In</>)}
            </button>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center"><span className="bg-card px-4 text-xs text-gray-600">or</span></div>
          </div>

          <Link to="/playground" className="w-full flex items-center justify-center gap-2 py-3 mt-6 rounded-xl border border-white/10 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <PlayCircle size={16} /> Try the Playground (no account needed)
          </Link>

          <p className="text-center text-sm text-gray-500 mt-6">
            New here?{' '}
            <Link to="/register" className="text-primary-light font-semibold hover:text-accent transition-colors">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
