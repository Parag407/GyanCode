import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Award, Calendar, User, Gift, AlertCircle, CheckCircle2,
  Search, ArrowLeft, Eye, Code2, Trash2, Download, X,
  Loader2, Sparkles, Tag, BookOpen, ChevronDown, Shield,
  Star, Medal, GraduationCap
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const CATEGORIES = ['Programming', 'Web Development', 'Data Structures', 'Algorithms', 'Machine Learning', 'Database', 'Other'];
const DIFF_COLORS = {
  Beginner:     'bg-emerald-500/10 text-emerald-400',
  Intermediate: 'bg-amber-500/10 text-amber-400',
  Advanced:     'bg-red-500/10 text-red-400',
};

// ──── Certificate Template ─────────────────────────────────────────────────────
export function CertificateTemplate({ cert, profile, templateId = "certificate-template", forPrint = false, customSettings = null }) {
  const recipientName = cert.recipient?.name || cert.awarded_to_name || 'Academic Scholar';
  const issuerName    = cert.users?.name || cert.issued_by_name || 'GyanCode Educator';

  // Fallback to cert.users settings if no customSettings provided (used directly in Certificates list)
  const settings = customSettings || cert.users?.certificate_settings || {};
  
  const themeColors = {
    amber: { border: 'border-amber-400', bgPrimary: 'bg-amber-500', textPrimary: 'text-amber-600', watermark: 'text-amber-600', decoration: ['bg-amber-500', 'bg-orange-600', 'bg-yellow-500', 'bg-amber-400'] },
    blue: { border: 'border-blue-400', bgPrimary: 'bg-blue-500', textPrimary: 'text-blue-600', watermark: 'text-blue-600', decoration: ['bg-blue-500', 'bg-cyan-600', 'bg-sky-500', 'bg-indigo-400'] },
    emerald: { border: 'border-emerald-400', bgPrimary: 'bg-emerald-500', textPrimary: 'text-emerald-600', watermark: 'text-emerald-600', decoration: ['bg-emerald-500', 'bg-teal-600', 'bg-green-500', 'bg-emerald-400'] },
    violet: { border: 'border-violet-400', bgPrimary: 'bg-violet-500', textPrimary: 'text-violet-600', watermark: 'text-violet-600', decoration: ['bg-violet-500', 'bg-purple-600', 'bg-fuchsia-500', 'bg-violet-400'] },
    rose: { border: 'border-rose-400', bgPrimary: 'bg-rose-500', textPrimary: 'text-rose-600', watermark: 'text-rose-600', decoration: ['bg-rose-500', 'bg-pink-600', 'bg-red-500', 'bg-rose-400'] },
  };

  const theme = themeColors[settings.primaryColor] || themeColors.amber;
  const fontFamily = settings.fontFamily || "'Georgia', serif";
  const signatureText = settings.signatureText || "Authorized Educator";
  
  // Base text styling
  const fontStyle = { fontFamily };

  return (
    <div
      id={templateId}
      className="bg-white text-gray-900 relative overflow-hidden"
      style={{ width: '1000px', minHeight: '700px', ...fontStyle }}
    >
      {/* Dynamic border frame */}
      <div className={`absolute inset-0 border-[20px] ${theme.border}/30 pointer-events-none`} />
      <div className={`absolute inset-[20px] border-[3px] ${theme.border}/20 pointer-events-none`} />

      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <Award size={500} className={theme.watermark} />
      </div>

      {/* Decorative circles using theme colors */}
      <div className={`absolute top-0 left-0 w-48 h-48 ${theme.decoration[0]}/5 rounded-full -translate-x-24 -translate-y-24`} />
      <div className={`absolute bottom-0 right-0 w-64 h-64 ${theme.decoration[1]}/5 rounded-full translate-x-32 translate-y-32`} />
      <div className={`absolute top-0 right-0 w-32 h-32 ${theme.decoration[2]}/5 rounded-full translate-x-16 -translate-y-16`} />
      <div className={`absolute bottom-0 left-0 w-40 h-40 ${theme.decoration[3]}/5 rounded-full -translate-x-20 translate-y-20`} />

      {/* Content */}
      <div className="relative p-16 flex flex-col items-center text-center min-h-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className={`w-14 h-14 ${theme.bgPrimary} shadow-lg rounded-2xl flex items-center justify-center`}>
            <Code2 size={28} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className={`text-2xl font-black tracking-tight ${theme.textPrimary}`}>GyanCode</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Learning Platform</p>
          </div>
        </div>

        {/* Title ribbon */}
        <div className={`bg-${theme.bgPrimary.split('-')[1]}-50 border ${theme.border}/30 rounded-full py-2 px-10 mb-6`}>
          <p className={`${theme.textPrimary} font-bold uppercase tracking-[0.25em] text-sm`}>Certificate of Achievement</p>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-2 tracking-tight" style={fontStyle}>
          PROFICIENCY
        </h1>
        {cert.category && (
          <p className={`text-sm font-bold uppercase tracking-widest ${theme.textPrimary} mb-6`}>in {cert.category}</p>
        )}

        <p className="text-gray-500 font-medium text-lg mb-2">This certificate is proudly presented to</p>

        {/* Recipient name */}
        <div className={`py-4 border-b-2 ${theme.border}/40 w-96 mx-auto mb-4`}>
          <h3 className={`text-3xl sm:text-4xl font-black ${theme.textPrimary} italic`} style={fontStyle}>
            {recipientName}
          </h3>
          {cert.recipient?.department && (
            <p className="text-sm text-gray-400 mt-1">{cert.recipient.department}</p>
          )}
        </div>

        {/* Achievement text */}
        <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-2">
          For successfully demonstrating exceptional skill and dedication in
        </p>
        <p className="text-gray-900 font-bold text-xl mb-4">"{cert.title}"</p>

        {/* Description */}
        {cert.description && (
          <p className="text-gray-500 text-sm max-w-md mx-auto italic mb-4">{cert.description}</p>
        )}

        {/* Skills */}
        {cert.skills && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {cert.skills.split(',').map((s, i) => (
              <span key={i} className={`bg-gray-100 ${theme.textPrimary} text-xs font-bold px-3 py-1 rounded-full border border-gray-200`}>
                {s.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-12 pt-8 items-end w-full max-w-2xl mt-auto">
          <div className="space-y-2 text-left">
            <div className="border-b-2 border-gray-300 pb-2 italic text-xl text-gray-800">
              {issuerName}
            </div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{signatureText}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 ${theme.bgPrimary} shadow-md rounded-full flex items-center justify-center mb-2`}>
              <Award size={28} className="text-white" />
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Verified</p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2">
              {cert.issued_on
                ? new Date(cert.issued_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Date of Issuance</p>
          </div>
        </div>

        {/* Verification bar */}
        <div className="absolute bottom-8 flex items-center gap-3 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
          <Shield size={10} className="text-gray-400" />
          <span>GYANCODE ID: {(cert.id || 'PREVIEW').toString().slice(0, 8).toUpperCase()}</span>
          <span>•</span>
          <span>DIGITALLY VERIFIED</span>
          <span>•</span>
          <span>PLATFORM CERTIFIED</span>
        </div>
      </div>
    </div>
  );
}

// ──── Certificate Card ─────────────────────────────────────────────────────────
function CertificateCard({ cert, profile, onView, onRevoke, revoking }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const element = document.getElementById(`hidden-cert-${cert.id}`);
      if (!element) throw new Error('Template not found');
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1000, 700]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, 1000, 700);
      const safeTitle = (cert.title || 'Certificate').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`gyancode_certificate_${safeTitle}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/20 transition-all duration-300 group hover:-translate-y-1 relative">
      {/* Hidden template for downloading */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none', zIndex: -100 }}>
        <CertificateTemplate cert={cert} profile={profile} templateId={`hidden-cert-${cert.id}`} />
      </div>

      {/* Gold top bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/5 p-3 rounded-xl">
            <Award size={24} className="text-amber-400" />
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={handleDownload} disabled={downloading}
              className="p-2 bg-white/5 hover:bg-amber-500/15 rounded-lg text-gray-500 hover:text-amber-400 transition-all disabled:opacity-50" title="Download PDF">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            </button>
            <button onClick={() => onView(cert)}
              className="p-2 bg-white/5 hover:bg-primary/15 rounded-lg text-gray-500 hover:text-primary-light transition-all" title="View Certificate">
              <Eye size={14} />
            </button>
            {(profile?.role === 'Educator' || profile?.role === 'Admin') && (
              <button onClick={() => onRevoke(cert.id)} disabled={revoking === cert.id}
                className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all disabled:opacity-50" title="Revoke">
                {revoking === cert.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold leading-tight">{cert.title}</h3>
          {cert.category && (
            <span className="text-[11px] font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-lg mt-1 inline-block">
              {cert.category}
            </span>
          )}
          {cert.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{cert.description}</p>
          )}
        </div>

        {cert.skills && (
          <div className="flex flex-wrap gap-1">
            {cert.skills.split(',').slice(0, 3).map((s, i) => (
              <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/5">{s.trim()}</span>
            ))}
            {cert.skills.split(',').length > 3 && (
              <span className="text-[10px] text-gray-600">+{cert.skills.split(',').length - 3} more</span>
            )}
          </div>
        )}

        <div className="border-t border-white/5 pt-3 space-y-1.5">
          {profile?.role !== 'Student' && cert.recipient && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <GraduationCap size={12} className="text-blue-400" />
              Awarded to <span className="font-semibold text-white">{cert.recipient.name}</span>
            </p>
          )}
          {profile?.role !== 'Educator' && cert.users && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <User size={12} className="text-violet-400" />
              Issued by <span className="font-semibold text-gray-300">{cert.users.name}</span>
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Calendar size={12} />
            {cert.issued_on ? new Date(cert.issued_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onView(cert)}
            className="flex-1 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/30 text-amber-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
            <Eye size={13} /> <span className="hidden sm:inline">View</span>
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex-1 bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-amber-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} 
            <span className="hidden sm:inline">{downloading ? 'Preparing...' : 'Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──── Issue Form ───────────────────────────────────────────────────────────────
function IssueForm({ students, onIssued, onCancel, initialAwardedTo }) {
  const [form, setForm] = useState({ 
    awarded_to: initialAwardedTo || '', 
    title: '', 
    description: '', 
    skills: '', 
    category: '' 
  });
  const [search, setSearch] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!form.awarded_to || !form.title.trim()) { setError('Please select a student and enter a title.'); return; }
    setIssuing(true); setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const cert = await res.json();
      onIssued(cert);
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to issue certificate.');
    }
    setIssuing(false);
  };

  const selectedStudent = students.find(s => s.id === form.awarded_to);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-8 border border-white/10 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift size={20} className="text-amber-400" /> Issue New Certificate
        </h2>
        <button onClick={onCancel} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Certificate details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Certificate Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all text-sm"
              placeholder="e.g. Python Programming Excellence" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:bg-white/[0.07] transition-all text-sm appearance-none cursor-pointer">
              <option value="" className="bg-card">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all text-sm resize-none"
              placeholder="Brief description of what was accomplished..." />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Skills (comma separated)</label>
            <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all text-sm"
              placeholder="Python, OOP, Data Structures" />
            {form.skills && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skills.split(',').filter(s => s.trim()).map((s, i) => (
                  <span key={i} className="text-[11px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">{s.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Select student */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Award To (Student) *</label>
          {selectedStudent && (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-emerald-400">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">{selectedStudent.name}</p>
                <p className="text-[11px] text-gray-400">{selectedStudent.email}</p>
              </div>
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            </div>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
              placeholder="Search students..." />
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-white/5 p-1.5 bg-white/[0.02]">
            {filtered.length === 0 && <p className="text-center py-4 sm:py-6 text-xs text-gray-600">No students found</p>}
            {filtered.map(s => (
              <button key={s.id} onClick={() => setForm({ ...form, awarded_to: s.id })}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm border ${
                  form.awarded_to === s.id
                    ? 'bg-primary/10 border-primary/30 text-white'
                    : 'hover:bg-white/5 border-transparent text-gray-300'
                }`}>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{s.email} {s.department ? `• ${s.department}` : ''}</p>
                </div>
                <span className="text-xs text-amber-400 font-bold shrink-0">{s.total_points || 0} pts</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={handleSubmit} disabled={issuing || !form.title.trim() || !form.awarded_to}
          className="btn-primary px-5 sm:px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-all flex items-center gap-2 text-white">
          {issuing ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
          <span className="hidden sm:inline">{issuing ? 'Issuing...' : 'Issue Certificate'}</span>
        </button>
        <button onClick={onCancel} className="px-4 sm:px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm">
          <span className="hidden sm:inline">Cancel</span>
          <X className="sm:hidden" size={20} />
        </button>
      </div>
    </div>
  );
}

// ──── Certificate Modal (Full View) ───────────────────────────────────────────
function CertificateModal({ cert, profile, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        // Scale to fit viewport width/height reasonably
        const parentWidth = containerRef.current.clientWidth;
        const maxHeight = window.innerHeight * 0.8; // 80vh max
        
        // Fit exactly to width, minus 8px total (4px margin on each side)
        const widthScale = (parentWidth - 8) / 1000;
        const heightScale = maxHeight / 700;
        
        const newScale = Math.min(widthScale, heightScale, 1);
        setScale(newScale);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById('certificate-template');
      // Create canvas with higher scale for better quality
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1000, 700] // Matching the certificate template width/minHeight
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, 1000, 700);
      const safeTitle = (cert.title || 'Certificate').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`gyancode_certificate_${safeTitle}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl animate-zoom-in">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Award size={20} className="text-amber-400" /> Certificate Preview
          </h2>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} disabled={downloading}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              <span className="hidden sm:inline">{downloading ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button onClick={onClose}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div 
          ref={containerRef} 
          className="w-full relative flex justify-center rounded-2xl print:rounded-none" 
          style={{ height: `${700 * scale}px` }}
        >
          <div 
            className="absolute top-0 shadow-2xl shadow-black/60 rounded-xl overflow-hidden print:shadow-none"
            style={{ 
              width: '1000px', 
              height: '700px', 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center' 
            }}
          >
            <CertificateTemplate cert={cert} profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ──── Main Certificates Page ───────────────────────────────────────────────────
export default function Certificates() {
  const navigate = useNavigate();
  const location = useLocation();
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents]         = useState([]);
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [revoking, setRevoking]         = useState(null);
  const [viewing, setViewing]           = useState(null);
  const [search, setSearch]             = useState('');
  const [catFilter, setCatFilter]       = useState('All');
  const [successMsg, setSuccessMsg]     = useState(null);
  const [stats, setStats]               = useState({ total: 0, thisMonth: 0, categories: {} });

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMounted) { setLoading(false); return; }
      const h = { Authorization: `Bearer ${session.access_token}` };

      try {
        const [profileRes, certsRes, subRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/profile`, { headers: h }),
          fetch(`${import.meta.env.VITE_API_URL}/certificates`, { headers: h }),
          fetch(`${import.meta.env.VITE_API_URL}/submissions`, { headers: h }),
        ]);

        if (!isMounted) return;

        const profileData = await profileRes.json();
        setProfile(profileData);

        let fetchedStudents = [];
        if (['Educator', 'Admin'].includes(profileData.role)) {
          const studRes = await fetch(`${import.meta.env.VITE_API_URL}/students`, { headers: h });
          if (studRes.ok && isMounted) {
            fetchedStudents = await studRes.json();
            setStudents(fetchedStudents);
          }
        }

        if (certsRes.ok && isMounted) {
          const certsData = await certsRes.json();
          const certs = Array.isArray(certsData) ? certsData : [];
          setCertificates(certs);

          // Compute stats
          const now = new Date();
          const thisMonth = certs.filter(c => {
            const d = new Date(c.issued_on);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length;
          const categories = {};
          certs.forEach(c => { if (c.category) categories[c.category] = (categories[c.category] || 0) + 1; });
          
          const subData = await subRes.json();
          const solvedCount = new Set((Array.isArray(subData) ? subData : []).filter(s => s.status === 'Success').map(s => s.assignment_id)).size;

          setStats({ total: certs.length, thisMonth, categories, solvedCount });
        }

        // Check for deep link
        const queryParams = new URLSearchParams(location.search);
        const initialAwardedTo = queryParams.get('awarded_to');
        if (initialAwardedTo && ['Educator', 'Admin'].includes(profileData.role) && isMounted) {
          setShowForm(true);
        }
      } catch (err) {
        console.error("Certificates Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [location.search]);

  const handleIssued = (cert) => {
    setCertificates(prev => [cert, ...prev]);
    setShowForm(false);
    setSuccessMsg(`Certificate "${cert.title}" issued successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
    // Update stats
    setStats(prev => ({ ...prev, total: prev.total + 1, thisMonth: prev.thisMonth + 1 }));
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this certificate? This action cannot be undone.')) return;
    setRevoking(id);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/certificates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      setCertificates(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    }
    setRevoking(null);
  };

  const allCategories = ['All', ...new Set(certificates.map(c => c.category).filter(Boolean))];

  const filtered = certificates.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.title?.toLowerCase().includes(q) ||
      c.recipient?.name?.toLowerCase().includes(q) ||
      c.users?.name?.toLowerCase().includes(q) ||
      c.skills?.toLowerCase().includes(q);
    const matchCat = catFilter === 'All' || c.category === catFilter;
    return matchQ && matchCat;
  });

  // Soft loading check
  const isDataReady = !loading || certificates.length > 0;

  const isEducator = ['Educator', 'Admin'].includes(profile?.role);

  return (
    <div className={`max-w-6xl mx-auto space-y-8 animate-fade-in-up ${loading ? 'opacity-60 transition-opacity' : ''}`}>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5 w-fit">
        <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-3 rounded-2xl">
              <Award size={26} className="text-amber-400" />
            </div>
            Certificates
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-14">
            {isEducator ? 'Issue and manage achievement certificates for students' : 'Your earned achievement certificates'}
          </p>
        </div>
        {isEducator && !showForm && (
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => navigate('/educator/customize-certificate')}
              className="bg-white/5 hover:bg-white/10 text-white px-3 sm:px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
              <Sparkles size={16} className="text-indigo-400" /> <span className="hidden sm:inline">Customize Style</span>
            </button>
            <button onClick={() => setShowForm(true)}
              className="btn-primary text-white px-3 sm:px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
              <Gift size={16} /> <span className="hidden sm:inline">Issue Certificate</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Milestone (For Students) */}
      {!isEducator && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center gap-4 sm:gap-6 shadow-xl shadow-primary/5">
          <div className="bg-primary/20 p-4 rounded-2xl">
            <Trophy size={32} className="text-primary-light" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-lg font-black text-white">Milestone Progress</h3>
            <p className="text-sm text-gray-400">You've solved <span className="text-primary-light font-bold">{stats.solvedCount || 0}</span> unique assignments. Keep going to earn more recognition!</p>
          </div>
          <div className="flex items-center gap-4 bg-black/20 px-4 sm:px-6 py-3 rounded-xl border border-white/5">
             <div className="text-center">
               <p className="text-xl font-black text-white">{stats.solvedCount || 0}</p>
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Solved</p>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="text-center">
               <p className="text-xl font-black text-amber-400">{stats.total}</p>
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Awards</p>
             </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {!isDataReady ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 h-24 animate-pulse bg-white/5"></div>
          ))
        ) : (
          stats.total > 0 && [
            { label: 'Total Certificates', value: stats.total, icon: <Award size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'This Month', value: stats.thisMonth, icon: <Calendar size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Categories', value: Object.keys(stats.categories).length, icon: <Tag size={18} />, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: isEducator ? 'Students Awarded' : 'Educators', value: isEducator ? new Set(certificates.map(c => c.awarded_to)).size : new Set(certificates.map(c => c.issued_by)).size, icon: <GraduationCap size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4 border border-white/5">
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">{successMsg}</p>
        </div>
      )}

      {/* Issue Form */}
      {showForm && isEducator && (
        <IssueForm 
          students={students} 
          onIssued={handleIssued} 
          onCancel={() => {
            setShowForm(false);
            navigate('/certificates', { replace: true }); // Clear URL params
          }}
          initialAwardedTo={new URLSearchParams(location.search).get('awarded_to')}
        />
      )}

      {/* Filters */}
      {certificates.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 relative min-w-48">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
              placeholder="Search by title, student, skills..." />
          </div>
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl flex-wrap">
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === cat ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500 hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">{filtered.length} results</span>
        </div>
      )}

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {!isDataReady ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-80 animate-pulse bg-white/5"></div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(cert => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              profile={profile}
              onView={setViewing}
              onRevoke={handleRevoke}
              revoking={revoking}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed border-white/10">
            <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-400 italic">No certificates found</h3>
            <p className="text-gray-600 text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>

      {/* Full Certificate Modal */}
      {viewing && (
        <CertificateModal cert={viewing} profile={profile} onClose={() => setViewing(null)} />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          body > div:has(#certificate-template) { display: block !important; }
          #certificate-template { display: block !important; width: 100% !important; }
          .fixed.inset-0 { position: static !important; }
          .absolute.inset-0.bg-black { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
