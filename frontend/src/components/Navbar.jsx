import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Code2, LayoutDashboard, FilePlus, Trophy, History, Award, User, ChevronDown, Bot, PlayCircle, TrendingUp, Megaphone, Swords, Shield, BookOpen, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar({ session, profile, settings = {} }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false); // User dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile navbar toggle
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const NavLinks = ({ mobile = false }) => {
    const baseClass = mobile 
      ? "flex items-center gap-2.5 text-base font-semibold text-gray-300 hover:text-white transition-colors px-4 py-3 rounded-xl hover:bg-white/5 w-full" 
      : "flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5";
    
    const highlightClass = mobile
      ? "flex items-center gap-2.5 text-base font-semibold text-emerald-400 hover:text-emerald-300 transition-colors px-4 py-3 rounded-xl hover:bg-emerald-500/10 w-full"
      : "flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-500/10";

    const adminClass = mobile
      ? "flex items-center gap-2.5 text-base font-semibold text-red-400 hover:text-red-300 transition-colors px-4 py-3 rounded-xl hover:bg-red-500/10 w-full"
      : "flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10";

    const primaryClass = mobile
      ? "flex items-center gap-2.5 text-base font-semibold text-primary-light hover:text-primary transition-colors px-4 py-3 rounded-xl hover:bg-white/5 w-full"
      : "flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-light transition-colors px-3 py-2 rounded-lg hover:bg-white/5";

    return (
      <>
        {/* Always visible links */}
        <Link to="/playground" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
          <PlayCircle size={16} /> Playground
        </Link>
        {(settings.student_leaderboard_visible !== false || profile?.role === 'Admin') && (
          <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
            <Trophy size={16} /> Leaderboard
          </Link>
        )}
        <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className={primaryClass}>
          <BookOpen size={16} /> Docs
        </Link>

        {session && ['Educator', 'Admin'].includes(profile?.role) && (
          <>
            {profile?.role === 'Admin' && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={adminClass}>
                <Shield size={16} /> Admin Panel
              </Link>
            )}
            <Link to="/educator/dashboard" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/educator/my-assignments" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <Code2 size={16} /> Assignments
            </Link>
            <Link to="/educator/all-submissions" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <History size={16} /> Submissions
            </Link>
            <Link to="/certificates" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <Award size={16} /> Certificates
            </Link>
            <Link to="/announcements" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <Megaphone size={16} /> News
            </Link>
          </>
        )}

        {session && profile?.role === 'Student' && (
          <>
            <Link to="/student/dashboard" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <LayoutDashboard size={16} /> Home
            </Link>
            <Link to="/student/assignments" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <Code2 size={16} /> Assignments
            </Link>
            <Link to="/student/assignments" onClick={() => setMobileMenuOpen(false)} className={highlightClass}>
              <Swords size={16} /> Solve
            </Link>
            <Link to="/certificates" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <Award size={16} /> Certificates
            </Link>
            <Link to="/announcements" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <Megaphone size={16} /> News
            </Link>
            <Link to="/student/progress" onClick={() => setMobileMenuOpen(false)} className={baseClass}>
              <TrendingUp size={16} /> Progress
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <>
    <nav className="sticky top-0 z-50 glass-card border-b border-white/5 animate-slide-down">
      <div className="container mx-auto flex justify-between items-center px-4 lg:px-6 py-3">
        {/* Brand */}
        <Link 
          to={!session ? "/" : profile?.role === 'Educator' ? "/educator/dashboard" : profile?.role === 'Admin' ? "/admin" : "/student/dashboard"} 
          className="flex items-center gap-2.5 group z-50"
        >
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
            <Code2 size={22} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight gradient-text hidden sm:block">GyanCode</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          <NavLinks />
        </div>

        {/* Right Side: Auth & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 z-50">
          {session ? (
            <div className="relative border-l border-white/10 pl-2 ml-1" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {profile?.name?.charAt(0) || '?'}
                </div>
                <div className="text-left hidden sm:block max-w-[120px]">
                  <p className="text-sm font-semibold text-white leading-tight truncate">{profile?.name || 'User'}</p>
                  <p className="text-[10px] text-primary-light font-medium truncate">{profile?.role}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0f] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.8)] border border-white/10 py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-white/5 mb-1 sm:hidden">
                    <p className="text-sm font-semibold text-white leading-tight truncate">{profile?.name || 'User'}</p>
                    <p className="text-[10px] text-primary-light font-medium truncate">{profile?.role}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                    <User size={16} /> My Profile
                  </Link>
                  {profile?.role === 'Student' && (
                    <Link to="/student/submissions" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <History size={16} /> My Submissions
                    </Link>
                  )}
                  <Link to="/announcements" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                    <Megaphone size={16} /> Announcements
                  </Link>
                  {(settings.student_ai_tutor_enabled !== false || profile?.role === 'Admin') && (
                    <Link to="/ai-tutor" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Bot size={16} /> AI Tutor
                    </Link>
                  )}
                  <div className="border-t border-white/5 my-1"></div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2 sm:gap-3 items-center">
              <Link to="/login" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">Login</Link>
              <Link to="/register" className="btn-primary px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Sidebar Panel */}
          <div className="relative w-72 h-full bg-[#0a0a0f] border-l border-white/10 shadow-2xl flex flex-col animate-slide-down" style={{ animationDirection: 'normal', animationName: 'fadeInRight', animationDuration: '0.3s' }}>
            <div className="flex justify-between items-center p-5 border-b border-white/5">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Code2 size={20} className="text-primary-light" /> Menu
              </h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              <NavLinks mobile={true} />
              
              {!session && (
                <div className="w-full pt-6 mt-4 border-t border-white/10 flex flex-col gap-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-sm font-bold text-gray-300 bg-white/5 py-3.5 rounded-xl hover:bg-white/10 transition-colors w-full">Login</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary text-center text-sm font-bold text-white py-3.5 rounded-xl w-full flex items-center justify-center gap-2">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
