import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Code2, Zap, Shield, BarChart3, ArrowRight, Sparkles, Trophy, Users, FileCheck, Bot, PlayCircle, Award, ChevronRight, CheckCircle2, XCircle, Star, ChevronLeft } from 'lucide-react';

const TESTIMONIALS = [
  { name: 'Rohan Mehta', dept: 'Computer Science, 3rd Year', text: 'GyanCode completely changed how I prepare for coding interviews. The AI hints nudge you in the right direction without giving away the answer.', stars: 5 },
  { name: 'Priya Sharma', dept: 'Information Technology, 2nd Year', text: 'The real-time code execution is blazing fast. I went from barely understanding loops to solving Advanced Python problems in just 6 weeks!', stars: 5 },
  { name: 'Akash Gupta', dept: 'Electronics & CS, 4th Year', text: 'My educator loves how easy it is to assign problems and track our progress. The submission history with educator feedback is super helpful.', stars: 5 },
  { name: 'Sneha Patil', dept: 'Computer Science, 1st Year', text: 'As a complete beginner, the Beginner-rated problems and AI tutor gave me the confidence to keep coding every day. My streak is now 21 days!', stars: 5 },
];

const LANG_ICONS = [
  { name: 'Python', emoji: '🐍', color: 'from-blue-500/15 to-indigo-500/5 border-blue-500/20 text-blue-300' },
  { name: 'JavaScript', emoji: '⚡', color: 'from-amber-500/15 to-yellow-500/5 border-amber-500/20 text-amber-300' },
  { name: 'C', emoji: '⚙️', color: 'from-slate-500/15 to-gray-500/5 border-slate-500/20 text-slate-300' },
  { name: 'C++', emoji: '🔷', color: 'from-cyan-500/15 to-sky-500/5 border-cyan-500/20 text-cyan-300' },
  { name: 'Java', emoji: '☕', color: 'from-orange-500/15 to-red-500/5 border-orange-500/20 text-orange-300' },
];

export default function Home({ session, profile }) {
  const [stats, setStats] = useState({ students: 0, submissions: 0, leaders: [] });
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/leaderboard');
        const data = await res.json();
        if (isMounted) setStats({ 
          students: data.totalStudents || 0, 
          submissions: data.totalSubmissions || 0,
          leaders: (data.leaders || []).slice(0, 3) 
        });
      } catch {}
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // Auto-cycle testimonials every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center text-center overflow-hidden">
      <div className="gradient-blob"></div>
      <div className="gradient-blob-2"></div>

      {/* Hero Section */}
      <div className="relative z-10 space-y-8 max-w-4xl py-20 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-sm font-medium mb-4">
          <Sparkles size={14} />
          AI-Powered Learning Platform
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
          Master Coding with{' '}
          <span className="gradient-text">Intelligent</span>
          <br />
          <span className="gradient-text">Feedback</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Interactive coding assessments with real-time execution, AI-powered hints from Google Gemini, and comprehensive progress tracking.
        </p>

        <div className="flex gap-4 justify-center pt-4 flex-wrap">
          <Link to={!session ? "/register" : profile?.role === 'Educator' ? "/educator/dashboard" : "/student/dashboard"}
            className="btn-primary text-white px-4 sm:px-8 py-3.5 rounded-xl text-base font-bold flex items-center gap-2 group">
            {session ? 'Go to Dashboard' : 'Start Learning'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          {session && profile?.role === 'Student' && (
            <Link to="/student/assignments"
              className="px-4 sm:px-8 py-3.5 rounded-xl text-base font-bold border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:border-primary/50 flex items-center gap-2 text-primary-light group">
              <Code2 size={18} /> Browse Assignments
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          <Link to="/playground" className="px-4 sm:px-8 py-3.5 rounded-xl text-base font-bold border border-white/10 hover:bg-white/5 transition-all duration-300 hover:border-white/20 flex items-center gap-2">
            <PlayCircle size={18} /> Try Playground
          </Link>
        </div>
      </div>

      {/* Quick Actions for Logged-in Students */}
      {session && profile?.role === 'Student' && (
        <div className="relative z-10 w-full max-w-5xl mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { to: '/student/assignments', icon: <Code2 size={18} />, label: 'Assignments', color: 'text-primary-light', bg: 'from-primary/10 to-accent/5', border: 'border-primary/20 hover:border-primary/40' },
              { to: '/student/dashboard', icon: <Users size={18} />, label: 'My Dashboard', color: 'text-blue-400', bg: 'from-blue-500/10 to-sky-500/5', border: 'border-blue-500/20 hover:border-blue-500/40' },
              { to: '/student/progress', icon: <BarChart3 size={18} />, label: 'My Progress', color: 'text-violet-400', bg: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/20 hover:border-violet-500/40' },
              { to: '/ai-tutor', icon: <Bot size={18} />, label: 'AI Tutor', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
              { to: '/leaderboard', icon: <Trophy size={18} />, label: 'Leaderboard', color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20 hover:border-amber-500/40' },
            ].map((q, i) => (
              <Link key={i} to={q.to}
                className={`bg-gradient-to-br ${q.bg} border ${q.border} rounded-xl px-4 py-3 flex items-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 group`}>
                <span className={q.color}>{q.icon}</span>
                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Languages Supported Row */}
      <div className="relative z-10 w-full max-w-3xl mb-4">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Supported Languages</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {LANG_ICONS.map(l => (
            <div key={l.name} className={`bg-gradient-to-br ${l.color} border rounded-xl px-5 py-2.5 flex items-center gap-2 font-bold text-sm hover:-translate-y-0.5 transition-all`}>
              <span className="text-lg">{l.emoji}</span> {l.name}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl mt-8">
        {[
          { icon: <Zap className="text-amber-400" size={24} />, title: 'Code Sandbox', desc: 'Write and execute Python, JS, C, C++, Java in a secure environment.', gradient: 'from-amber-500/10 to-orange-500/5', border: 'hover:border-amber-500/30', link: '/playground', linkText: 'Try Now' },
          { icon: <Shield className="text-emerald-400" size={24} />, title: 'AI Hints', desc: 'Gemini analyzes your code and gives actionable guidance without spoiling answers.', gradient: 'from-emerald-500/10 to-teal-500/5', border: 'hover:border-emerald-500/30', link: '/ai-tutor', linkText: 'Chat with GyanBot' },
          { icon: <BarChart3 className="text-violet-400" size={24} />, title: 'Progress Tracking', desc: 'Detailed charts, weekly activity, language breakdown, and rank cards.', gradient: 'from-violet-500/10 to-purple-500/5', border: 'hover:border-violet-500/30', link: '/register', linkText: 'Get Started' },
          { icon: <Award className="text-rose-400" size={24} />, title: 'Certificates', desc: 'Earn digital certificates from educators to showcase your achievements.', gradient: 'from-rose-500/10 to-pink-500/5', border: 'hover:border-rose-500/30', link: '/register', linkText: 'Join Now' },
        ].map((f, i) => (
          <Link to={f.link} key={i}
            className={`glass-card p-7 rounded-2xl space-y-3 text-left transition-all duration-300 hover:-translate-y-1 ${f.border} group block`}
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`bg-gradient-to-br ${f.gradient} w-12 h-12 rounded-xl flex items-center justify-center`}>{f.icon}</div>
            <h3 className="text-base font-bold text-white">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            <span className="text-xs font-semibold text-primary-light flex items-center gap-1 group-hover:gap-2 transition-all">
              {f.linkText} <ChevronRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      {/* How It Works */}
      <div className="relative z-10 w-full max-w-5xl mt-24 space-y-10">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">How It Works</h2>
          <p className="text-gray-500 text-sm mt-2">From classroom to code — in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { step: '01', title: 'Register', desc: 'Create your student or educator account in seconds.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { step: '02', title: 'Solve', desc: 'Pick an assignment, write code, and hit Run to test.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { step: '03', title: 'Get AI Hints', desc: 'Stuck? GyanBot analyzes your code and guides you.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { step: '04', title: 'Earn & Grow', desc: 'Earn points, climb the leaderboard, get certified.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 sm:p-6 text-center space-y-3 hover:-translate-y-1 transition-all duration-300">
              <span className={`${s.bg} ${s.color} text-xs font-black px-3 py-1 rounded-lg inline-block`}>{s.step}</span>
              <h4 className="font-bold text-white">{s.title}</h4>
              <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why GyanCode — Comparison Table */}
      <div className="relative z-10 w-full max-w-4xl mt-24 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Why GyanCode?</h2>
          <p className="text-gray-500 text-sm mt-2">See how GyanCode stacks up against traditional learning</p>
        </div>
        <div className="glass-card rounded-2xl overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-3 text-xs font-black uppercase tracking-widest text-gray-500 bg-white/[0.02] px-4 sm:px-6 py-3 border-b border-white/5">
            <span>Feature</span>
            <span className="text-center text-primary-light">GyanCode</span>
            <span className="text-center">Traditional</span>
          </div>
          {[
            ['Real-time Code Execution', true, false],
            ['AI-Powered Hints', true, false],
            ['Progress Analytics', true, false],
            ['Educator Feedback on Code', true, true],
            ['Leaderboard & Gamification', true, false],
            ['Digital Certificates', true, true],
            ['Multi-language Support', true, false],
          ].map(([feature, gc, trad], i) => (
            <div key={i} className={`grid grid-cols-3 px-4 sm:px-6 py-3.5 items-center text-sm ${i % 2 === 0 ? '' : 'bg-white/[0.01]'} border-b border-white/[0.04] last:border-0`}>
              <span className="text-gray-300 font-medium">{feature}</span>
              <span className="flex justify-center">
                {gc ? <CheckCircle2 size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-red-500/40" />}
              </span>
              <span className="flex justify-center">
                {trad ? <CheckCircle2 size={18} className="text-emerald-400/50" /> : <XCircle size={18} className="text-red-500/40" />}
              </span>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Testimonials Carousel */}
      <div className="relative z-10 w-full max-w-3xl mt-24 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Loved by Students</h2>
          <p className="text-gray-500 text-sm mt-2">Real feedback from our community</p>
        </div>
        <div className="relative">
          <div className="glass-card rounded-2xl p-4 sm:p-8 space-y-5 min-h-[180px] flex flex-col justify-between transition-all duration-500">
            <div className="flex gap-1">
              {[...Array(TESTIMONIALS[testimonialIdx].stars)].map((_, i) => (
                <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
              ))}
            </div>
            <p className="text-base text-gray-300 leading-relaxed italic">"{TESTIMONIALS[testimonialIdx].text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0">
                {TESTIMONIALS[testimonialIdx].name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{TESTIMONIALS[testimonialIdx].name}</p>
                <p className="text-xs text-gray-500">{TESTIMONIALS[testimonialIdx].dept}</p>
              </div>
            </div>
          </div>
          {/* Dot indicators + arrows */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setTestimonialIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setTestimonialIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-primary-light w-5' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
            <button onClick={() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Stats from Backend */}
      <div className="relative z-10 glass-card rounded-2xl p-10 w-full max-w-5xl mt-20 space-y-8">
        <h2 className="text-2xl font-black text-center">Platform at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
           {[
             { value: '5', label: 'Languages', icon: <Code2 size={20} />, color: 'text-primary-light' },
             { value: `${stats.students}+`, label: 'Students', icon: <Users size={20} />, color: 'text-blue-400' },
             { value: `${stats.submissions}+`, label: 'Submissions', icon: <FileCheck size={20} />, color: 'text-emerald-400' },
             { value: 'AI', label: 'Gemini Powered', icon: <Bot size={20} />, color: 'text-amber-400' },
           ].map((s, i) => (
            <div key={i} className="text-center space-y-2">
              <div className={`${s.color} mx-auto`}>{s.icon}</div>
              <p className="text-2xl sm:text-3xl font-black gradient-text">{s.value}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top Performers */}
        {stats.leaders.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 text-center flex items-center justify-center gap-2">
              <Trophy size={16} className="text-amber-400" /> Top Performers
            </h3>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {stats.leaders.map((l, i) => (
                <div key={l.id} className="glass-card rounded-2xl p-5 text-center w-full sm:w-40 hover:-translate-y-1 transition-all">
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-sm font-black ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-orange-500/20 text-orange-400'
                  }`}>{l.name?.charAt(0)}</div>
                  <p className="font-bold text-sm mt-2 truncate">{l.name}</p>
                  <p className="text-xs text-gray-500">{l.department || '—'}</p>
                  <p className="text-lg font-black gradient-text mt-1">{l.total_points}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link to="/leaderboard" className="text-xs text-primary-light font-semibold hover:underline flex items-center justify-center gap-1">
                View Full Leaderboard <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-20 mb-12 text-center space-y-6 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to Start Coding?</h2>
        <p className="text-gray-400">Join GyanCode today and level up your programming skills with AI-powered feedback and real-time code execution.</p>
        <div className="flex gap-4 justify-center">
          <Link to={!session ? "/register" : profile?.role === 'Educator' ? "/educator/dashboard" : "/student/dashboard"}
            className="btn-primary text-white px-4 sm:px-8 py-3.5 rounded-xl text-base font-bold flex items-center gap-2">
            {session ? 'Continue Learning' : 'Create Free Account'} <ArrowRight size={16} />
          </Link>
          <Link to="/leaderboard" className="px-4 sm:px-6 py-3.5 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 text-sm">
            <Trophy size={16} className="text-amber-400" /> Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
