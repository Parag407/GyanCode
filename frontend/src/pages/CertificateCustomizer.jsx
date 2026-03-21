import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Settings2, ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';

// Re-use the template component for the live preview
import { CertificateTemplate } from './Certificates'; // We will need to export it from Certificates.jsx

const THEMES = [
  { id: 'amber', name: 'Golden Amber', color: 'bg-amber-500' },
  { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
  { id: 'emerald', name: 'Emerald Green', color: 'bg-emerald-500' },
  { id: 'violet', name: 'Royal Violet', color: 'bg-violet-500' },
  { id: 'rose', name: 'Ruby Rose', color: 'bg-rose-500' },
];

const FONTS = [
  { id: "'Georgia', serif", name: 'Georgia (Classic)' },
  { id: "'Inter', sans-serif", name: 'Inter (Modern)' },
  { id: "'Playfair Display', serif", name: 'Playfair (Elegant)' },
  { id: "'Roboto Mono', monospace", name: 'Roboto Mono (Technical)' },
];

export default function CertificateCustomizer() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        
        // Fit exactly to width, minus 8px total (4px margin on each side)
        const widthScale = (parentWidth - 8) / 1000;
        
        // Relax the height constraint so we mostly just scale by width, but prevent it from getting taller than ~80% of the screen
        const maxHeight = window.innerHeight * 0.8; 
        const heightScale = maxHeight / 700;
        
        const newScale = Math.min(widthScale, heightScale, 1);
        setScale(newScale);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  const [settings, setSettings] = useState({
    primaryColor: 'amber',
    fontFamily: "'Georgia', serif",
    signatureText: 'Authorized Educator'
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setProfile(data);
      
      if (data.certificate_settings) {
        setSettings({
           primaryColor: data.certificate_settings.primaryColor || 'amber',
           fontFamily: data.certificate_settings.fontFamily || "'Georgia', serif",
           signatureText: data.certificate_settings.signatureText || 'Authorized Educator',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile/settings`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ certificate_settings: settings })
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
         const err = await res.json();
         alert(err.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Mock certificate data for the live preview
  const previewCert = {
    id: 'PREVIEW-1234',
    title: 'Advanced React Development',
    category: 'Web Development',
    description: 'Awarded for demonstrating comprehensive understanding of modern React patterns and performance optimization.',
    skills: 'React, Hooks, Context, Performance',
    issued_on: new Date().toISOString(),
    recipient: { name: 'Student Name', department: 'Computer Science' },
    users: { name: profile?.name || 'Educator Name' } // Issuer name
  };

  if (!profile) return (
    <div className="min-h-screen bg-bgColor flex items-center justify-center">
       <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-bgColor text-white p-4 sm:p-8 font-inter">
      <div className="max-w-7xl mx-auto space-y-8 mt-16">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/certificates')}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500/20 to-violet-500/10 p-3 rounded-2xl">
                  <Settings2 size={26} className="text-indigo-400" />
                </div>
                Customize Certificates
              </h1>
              <p className="text-gray-500 text-sm mt-1 ml-14">
                Personalize the layout and style of certificates you issue to your students.
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : 
             success ? <CheckCircle2 size={18} /> : <Save size={18} />}
            <span className="hidden sm:inline">{saving ? 'Saving...' : success ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/5 space-y-8">
              
              {/* Theme Color */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Theme Color
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(theme => (
                    <button 
                      key={theme.id}
                      onClick={() => setSettings({ ...settings, primaryColor: theme.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        settings.primaryColor === theme.id 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${theme.color} shadow-sm`} />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Typography
                </h3>
                <div className="space-y-3">
                  {FONTS.map(font => (
                    <button 
                      key={font.id}
                      onClick={() => setSettings({ ...settings, fontFamily: font.id })}
                      style={{ fontFamily: font.id }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        settings.fontFamily === font.id 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <span className="text-lg">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Signature Text */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Signature Title
                </h3>
                <input 
                  type="text" 
                  value={settings.signatureText}
                  onChange={e => setSettings({ ...settings, signatureText: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Authorized Educator, Lead Instructor"
                  maxLength={40}
                />
                <p className="text-xs text-gray-500 mt-2">This appears under your name on the certificate.</p>
              </div>

            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-2">
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/5 h-full flex flex-col items-center justify-center bg-gray-950/50">
               <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mb-6">Live Preview</p>
               
               <div 
                 ref={containerRef} 
                 className="w-full relative flex justify-center"
                 style={{ height: `${700 * scale}px` }}
               >
                 <div
                   className="absolute top-0 shadow-2xl rounded-xl overflow-hidden"
                   style={{ 
                     width: '1000px', 
                     height: '700px', 
                     transform: `scale(${scale})`, 
                     transformOrigin: 'top center' 
                   }}
                 >
                   <CertificateTemplate 
                     cert={previewCert} 
                     profile={profile} 
                     customSettings={settings}
                     templateId="preview-certificate"
                   />
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
