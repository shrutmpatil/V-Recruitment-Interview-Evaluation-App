// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './supabase.js';

import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import HomePage from './pages/HomePage.jsx';
import CompleteProfilePage from './pages/CompleteProfilePage.jsx';
import SchedulerPage from './pages/SchedulerPage.jsx';
import EvaluationListPage from './pages/EvaluationListPage.jsx';
import EvaluationDisclaimerPage from './pages/EvaluationDisclaimerPage.jsx';
import EvaluationForm from './components/EvaluationForm.jsx';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage.jsx';
import IntervieweeListPage from './pages/IntervieweeListPage.jsx';
import AdvancedAdminPage from './pages/AdvancedAdminPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PrincipalPage from './pages/PrincipalPage.jsx';
import FacultyPage from './pages/FacultyPage.jsx';
import StudentPage from './pages/StudentPage.jsx';
import PastFeedbackPage from './pages/PastFeedbackPage.jsx'; // New Import

const ProtectedRoute = ({ session, userProfile, children }) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session && userProfile && !userProfile.profile_complete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

const PublicRoute = ({ session, children }) => {
  if (session) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminPrincipalRoute = ({ userProfile, children }) => {
  if (!userProfile) return null;

  const allowed = userProfile.role === 'admin' || userProfile.role === 'principal';
  if (!allowed) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoute = ({ userProfile, children }) => {
    if (!userProfile || userProfile.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async (user) => {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getProfile(session.user);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute session={session}><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute session={session}><SignupPage /></PublicRoute>} />

        {/* Role-based Home Pages */}
        <Route path="/" element={<ProtectedRoute session={session} userProfile={userProfile}><HomePage userProfile={userProfile} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute session={session} userProfile={userProfile}><AdminRoute userProfile={userProfile}><AdminPage userProfile={userProfile} /></AdminRoute></ProtectedRoute>} />
        <Route path="/principal" element={<ProtectedRoute session={session} userProfile={userProfile}><PrincipalPage userProfile={userProfile} /></ProtectedRoute>} />
        <Route path="/faculty" element={<ProtectedRoute session={session} userProfile={userProfile}><FacultyPage userProfile={userProfile} /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute session={session} userProfile={userProfile}><StudentPage userProfile={userProfile} /></ProtectedRoute>} />

        {/* Common Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute session={session} userProfile={userProfile}><CompleteProfilePage userProfile={userProfile} isEditing={true} /></ProtectedRoute>} />
        <Route path="/complete-profile" element={session ? <CompleteProfilePage userProfile={userProfile} isEditing={false} /> : <Navigate to="/login" />} />
        <Route path="/evaluations/list" element={<ProtectedRoute session={session} userProfile={userProfile}><EvaluationListPage userProfile={userProfile} /></ProtectedRoute>} />
        <Route path="/evaluate/:scheduleId/disclaimer" element={<ProtectedRoute session={session} userProfile={userProfile}><EvaluationDisclaimerPage userProfile={userProfile} /></ProtectedRoute>} />
        <Route path="/evaluate/:scheduleId/start" element={<ProtectedRoute session={session} userProfile={userProfile}><EvaluationForm userProfile={userProfile} /> </ProtectedRoute>} />
        <Route path="/past-feedback" element={<ProtectedRoute session={session} userProfile={userProfile}><PastFeedbackPage userProfile={userProfile} /></ProtectedRoute>} /> {/* New Route */}

        {/* Admin/Principal Only Routes */}
        <Route path="/analytics" element={<ProtectedRoute session={session} userProfile={userProfile}><AdminPrincipalRoute userProfile={userProfile}><AnalyticsDashboardPage userProfile={userProfile} /></AdminPrincipalRoute></ProtectedRoute>} />

        {/* Admin Only Routes */}
        <Route path="/schedule" element={<ProtectedRoute session={session} userProfile={userProfile}><AdminRoute userProfile={userProfile}><SchedulerPage userProfile={userProfile} /></AdminRoute></ProtectedRoute>} />
        <Route path="/interviewees" element={<ProtectedRoute session={session} userProfile={userProfile}><AdminRoute userProfile={userProfile}><IntervieweeListPage userProfile={userProfile} /></AdminRoute></ProtectedRoute>} />
        <Route path="/advanced-admin" element={<ProtectedRoute session={session} userProfile={userProfile}><AdminRoute userProfile={userProfile}><AdvancedAdminPage userProfile={userProfile} /></AdminRoute></ProtectedRoute>} />

        <Route path="*" element={<div><h2>404 Page Not Found</h2><Link to="/">Go Home</Link></div>} />
      </Routes>
    </Router>
  );
}

export default App;