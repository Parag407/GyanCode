import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EducatorDashboard from './pages/EducatorDashboard';
import CreateAssignment from './pages/CreateAssignment';
import EditAssignment from './pages/EditAssignment';
import AssignmentDetail from './pages/AssignmentDetail';
import StudentProfile from './pages/StudentProfile';
import StudentDashboard from './pages/StudentDashboard';
import Workspace from './pages/Workspace';
import Submissions from './pages/Submissions';
import Leaderboard from './pages/Leaderboard';
import Certificates from './pages/Certificates';
import CertificateCustomizer from './pages/CertificateCustomizer';
import Playground from './pages/Playground';
import AiTutor from './pages/AiTutor';
import Progress from './pages/Progress';
import Announcements from './pages/Announcements';
import MyAssignments from './pages/MyAssignments';
import AllSubmissions from './pages/AllSubmissions';
import Documentation from './pages/Documentation';
import NotFound from './pages/NotFound';
import Assignments from './pages/Assignments';
import ResetPassword from './pages/ResetPassword';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[App] Initializing auth state...');
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('[App] getSession error:', error);
          setLoading(false);
          return;
        }
        console.log('[App] Session acquired:', session ? 'User ID: ' + session.user.id : 'No session');
        setSession(session);
        fetchSettings();
        if (session) fetchProfile(session.user.id);
        else setLoading(false);
      })
      .catch(err => {
        console.error('[App] getSession promise catch:', err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[App] onAuthStateChange event:', _event);
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    // Only show the full-page loader if we don't have a profile yet (initial load)
    if (!profile) setLoading(true);
    try {
      console.log('[App] Fetching profile for:', userId);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[App] Using backend profile API...');
        const res = await fetch(import.meta.env.VITE_API_URL + '/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const profileData = await res.json();
          console.log('[App] Backend profile fetched successfully:', profileData.role);
          setProfile(profileData);
          setLoading(false);
          return;
        }
        console.warn('[App] Backend profile API failed, trying fallback...');
      }
      
      const { data, error } = await supabase
        .from('users').select('*').eq('id', userId).single();
      if (error) {
        console.error('[App] Supabase profile data error:', error);
      }
      if (data) {
        console.log('[App] Profile fallback fetched from Supabase');
        setProfile(data);
      }
    } catch (e) {
      console.error('[App] Profile fetch error:', e);
    }
    setLoading(false);
    console.log('[App] Auth initialization complete.');
  };

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(import.meta.env.VITE_API_URL + '/admin/settings', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.warn('[App] Settings fetch error:', e);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark text-white font-sans relative">
        <div className="gradient-blob opacity-50"></div>
        <div className="gradient-blob-2 opacity-50"></div>

        <Navbar session={session} profile={profile} settings={settings} />
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
          {loading ? (
            <div className="min-h-screen bg-dark flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home session={session} profile={profile} />} />
              <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Public */}
              <Route path="/leaderboard" element={(settings.student_leaderboard_visible !== false || profile?.role === 'Admin') ? <Leaderboard profile={profile} /> : <Navigate to="/" />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/docs" element={<Documentation />} />

              {/* Authenticated */}
              <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/certificates" element={session ? <Certificates settings={settings} profile={profile} /> : <Navigate to="/login" />} />
              <Route path="/ai-tutor" element={(session && (settings.student_ai_tutor_enabled !== false || profile?.role === 'Admin')) ? <AiTutor /> : <Navigate to="/" />} />
              <Route path="/announcements" element={session ? <Announcements /> : <Navigate to="/login" />} />

              {/* Admin */}
              <Route path="/admin" element={profile?.role === 'Admin' ? <AdminPanel /> : <Navigate to="/" />} />

              {/* Educator & Admin Shared Views */}
              <Route path="/educator/assignment/:id" element={['Educator', 'Admin'].includes(profile?.role) ? <AssignmentDetail /> : <Navigate to="/" />} />
              <Route path="/educator/student/:id" element={['Educator', 'Admin'].includes(profile?.role) ? <StudentProfile /> : <Navigate to="/" />} />
              
              {/* Educator & Admin Shared Overrides */}
              <Route path="/educator/dashboard" element={['Educator', 'Admin'].includes(profile?.role) ? <EducatorDashboard settings={settings} profile={profile} /> : <Navigate to="/" />} />
              <Route path="/educator/create-assignment" element={(['Educator', 'Admin'].includes(profile?.role) && (settings.educator_create_assignments_enabled !== false || profile?.role === 'Admin')) ? <CreateAssignment /> : <Navigate to="/educator/dashboard" />} />
              <Route path="/educator/edit-assignment/:id" element={['Educator', 'Admin'].includes(profile?.role) ? <EditAssignment /> : <Navigate to="/" />} />
              <Route path="/educator/my-assignments" element={['Educator', 'Admin'].includes(profile?.role) ? <MyAssignments /> : <Navigate to="/" />} />
              <Route path="/educator/all-submissions" element={['Educator', 'Admin'].includes(profile?.role) ? <AllSubmissions /> : <Navigate to="/" />} />
              <Route path="/educator/customize-certificate" element={['Educator', 'Admin'].includes(profile?.role) ? <CertificateCustomizer /> : <Navigate to="/" />} />

              {/* Student */}
              <Route path="/student/dashboard" element={profile?.role === 'Student' ? <StudentDashboard /> : <Navigate to="/" />} />
              <Route path="/student/assignments" element={profile?.role === 'Student' ? <Assignments /> : <Navigate to="/" />} />
              <Route path="/student/assignmentdetail/:id" element={profile?.role === 'Student' ? <AssignmentDetail /> : <Navigate to="/" />} />
              <Route path="/student/workspace/:id" element={profile?.role === 'Student' ? <Workspace /> : <Navigate to="/" />} />
              <Route path="/student/submissions" element={profile?.role === 'Student' ? <Submissions /> : <Navigate to="/" />} />
              <Route path="/student/progress" element={profile?.role === 'Student' ? <Progress /> : <Navigate to="/" />} />
              <Route path="/student/playground" element={profile?.role === 'Student' ? <Playground /> : <Navigate to="/" />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
