import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, User, Building2, BookOpen, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

// Google G Logo SVG
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'Student', academic_year: '', department: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState(1); // 1-Details, 2-Role/Dept
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Step 1 -> Step 2
  const handleStep1 = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setStep(2);
  };

  // Step 2: Register & create profile
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create Supabase auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      const session = data?.session;
      const user = data?.user;

      if (!user) { setError('Signup failed. Please try again.'); setLoading(false); return; }

      // 2. If there's an active session (email confirm disabled), finalize profile now
      if (session) {
        const response = await fetch(import.meta.env.VITE_API_URL + '/complete-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            academic_year: form.academic_year,
            department: form.department,
          }),
        });

        if (!response.ok) {
          const resData = await response.json();
          setError(resData.error || 'Failed to complete profile creation.');
          setLoading(false);
          return;
        }

        navigate(form.role === 'Educator' ? '/educator/dashboard' : '/student/dashboard');
      } else {
        // Email confirmation is enabled in Supabase — show a notice
        setError('');
        setStep(3); // 3 = confirmation message step
        setLoading(false);
      }
    } catch {
      setError('Could not connect to the server. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
    // Browser will redirect — No further action needed
  };

  // Password strength
  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="gradient-blob"></div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-7">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {step === 3 ? 'Check Your Email' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm">
              {step === 1 && 'Join the GyanCode learning platform'}
              {step === 2 && 'Almost there — tell us about yourself'}
              {step === 3 && `A confirmation link was sent to ${form.email}`}
            </p>
          </div>

          {/* Confirmation step */}
          {step === 3 ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Please click the link in your email to verify your account. Once confirmed, you can sign in normally.
              </p>
              <Link to="/login" className="block w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base text-center">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 justify-center">
                <div className={`w-8 h-1 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
                <div className={`w-8 h-1 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
              </div>

              {/* Google Button — show on step 1 only */}
              {step === 1 && (
                <>
                  <button
                    id="btn-google-register"
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  >
                    <GoogleIcon />
                    {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center"><span className="bg-card px-4 text-xs text-gray-600">or register with email</span></div>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                  <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Step 1: Account Details */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><User size={11} /> Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                      placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={11} /> Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                      placeholder="you@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Lock size={11} /> Password</label>
                    <div className="relative">
                      <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={handleChange} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                        placeholder="Min 6 characters" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`}></div>
                          ))}
                        </div>
                        <span className={`text-[10px] font-semibold ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {strengthLabels[strength]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Lock size={11} /> Confirm Password</label>
                    <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                      className={`w-full bg-white/5 border rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all ${
                        form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-500/40' : 'border-white/10'
                      }`}
                      placeholder="Re-enter password" />
                    {form.confirmPassword && form.confirmPassword === form.password && (
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> Passwords match</p>
                    )}
                  </div>
                  <button type="submit" className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2">
                    Continue <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {/* Step 2: Role & Dept */}
              {step === 2 && (
                <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
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

                  <div className={`grid gap-3 ${form.role === 'Student' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {form.role === 'Student' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={11} /> Academic Year</label>
                        <select name="academic_year" value={form.academic_year} onChange={handleChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                          <option value="" className="bg-card">Select year</option>
                          {['FY', 'SY', 'TY', 'Final Year'].map(y => <option key={y} value={y} className="bg-card">{y}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={11} /> Department</label>
                      <select name="department" value={form.department} onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                        <option value="" className="bg-card">Select dept.</option>
                        {['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Other'].map(d =>
                          <option key={d} value={d} className="bg-card">{d}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3.5 rounded-xl font-bold text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-all">
                      Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-[2] btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      {loading ? 'Creating account...' : <><CheckCircle2 size={16} /> Create Account</>}
                    </button>
                  </div>
                </form>
              )}

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-light font-semibold hover:text-accent transition-colors">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
