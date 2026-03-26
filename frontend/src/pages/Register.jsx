import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, User, Building2, BookOpen, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight, KeyRound, MessageSquareCode } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'Student', academic_year: '', department: ''
  });
  const [otp, setOtp] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1-Details, 2-Role/Dept, 3-OTP
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Trigger Supabase Signup (Sends OTP)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If user already exists but is not confirmed, Supabase might just return data without error
      // Move to OTP step
      setStep(3);
    } catch {
      setError('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: form.email,
        token: otp,
        type: 'signup'
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Finalize Profile in Backend
        const response = await fetch(import.meta.env.VITE_API_URL + '/complete-registration', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
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

        // Success!
        navigate(form.role === 'Educator' ? '/educator/dashboard' : '/student/dashboard');
      }
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="gradient-blob"></div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        <div className="glass-card rounded-3xl p-4 sm:p-6 sm:p-10 space-y-7">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {step === 3 ? 'Verify Email' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm">
              {step === 3 ? `Enter the 6-digit code sent to ${form.email}` : 'Join the GyanCode learning platform'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 justify-center">
            <div className={`w-8 h-1 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
            <div className={`w-8 h-1 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
            <div className={`w-8 h-1 rounded-full transition-all ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`}></div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {step < 3 ? (
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="space-y-5">
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
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
                  <button type="submit"
                    className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
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
                      {loading ? 'Sending Code...' : <><MessageSquareCode size={16} /> Send OTP</>}
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">6-Digit Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all tracking-widest font-mono text-center"
                    placeholder="000000" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-all">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {loading ? 'Verifying...' : <><CheckCircle2 size={16} /> Verify & Join</>}
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-600">
                Didn't get the code? <button type="button" onClick={handleRegister} className="text-primary-light hover:underline">Resend</button>
              </p>
            </form>
          )}

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-light font-semibold hover:text-accent transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
