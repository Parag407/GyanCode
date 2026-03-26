import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, KeyRound, MessageSquareCode, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1-Email, 2-OTP & Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setStep(2);
        setSuccess('Reset code sent to your email.');
      }
    } catch {
      setError('Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verify OTP (type: recovery)
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // 2. If verified, data.session will be active. Now update password.
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="gradient-blob"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="glass-card rounded-3xl p-4 sm:p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Reset Password</h2>
            <p className="text-gray-500 text-sm">
              {step === 1 ? 'Enter your email to receive a reset code' : 'Set your new secure password'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-300">{success}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                    placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? 'Sending...' : <><MessageSquareCode size={16} /> Send Reset Code</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">6-Digit Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all tracking-widest font-mono text-center"
                    placeholder="000000" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                    placeholder="••••••••" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                    placeholder="••••••••" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-all">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] btn-primary text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {loading ? 'Updating...' : <><ArrowRight size={16} /> Reset Password</>}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-light font-semibold hover:text-accent transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
