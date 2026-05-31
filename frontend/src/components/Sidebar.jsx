// frontend/src/components/Sidebar.jsx
import React from 'react';
import { supabase } from '../supabase.js';
import '../assets/Dashboard.css';
import { Link } from 'react-router-dom';
import { Home, Calendar, TrendingUp, Users, Settings, LogOut, User, FileText } from 'lucide-react';

const HomeIcon = () => <Home size={24} />;
const CalendarIcon = () => <Calendar size={24} />;
const ProfileIcon = () => <User size={24} />;
const LogoutIcon = () => <LogOut size={24} />;
const AnalyticsIcon = () => <TrendingUp size={24} />;
const UsersIcon = () => <Users size={24} />;
const AdvancedIcon = () => <Settings size={24} />;
const EvaluationIcon = () => <FileText size={24} />;

function Sidebar({ userProfile }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = userProfile?.role === 'admin';
  const isPrincipal = userProfile?.role === 'principal';
  const isFacultyOrStudent = userProfile?.role === 'professor' || userProfile?.role === 'student';

  const currentPath = window.location.pathname;
  const getActiveClass = (path) => currentPath === path ? ' active' : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>V-Recruit</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item${getActiveClass('/')}`}>
          <HomeIcon />
          <span>Home</span>
        </Link>

        {isAdmin && (
          <>
            <Link to="/interviewees" className={`nav-item${getActiveClass('/interviewees')}`}>
              <UsersIcon />
              <span>Interviewee Profiles</span>
            </Link>
            <Link to="/schedule" className={`nav-item${getActiveClass('/schedule')}`}>
              <CalendarIcon />
              <span>Scheduler</span>
            </Link>
            <Link to="/analytics" className={`nav-item${getActiveClass('/analytics')}`}>
              <AnalyticsIcon />
              <span>Analytics</span>
            </Link>
            <Link to="/advanced-admin" className={`nav-item${getActiveClass('/advanced-admin')}`}>
              <AdvancedIcon />
              <span>Advanced Options</span>
            </Link>
          </>
        )}

        {isPrincipal && (
          <>
            <Link to="/evaluations/list" className={`nav-item${getActiveClass('/evaluations/list')}`}>
              <EvaluationIcon />
              <span>View My Evaluations</span>
            </Link>
            <Link to="/analytics" className={`nav-item${getActiveClass('/analytics')}`}>
              <AnalyticsIcon />
              <span>View Analytics</span>
            </Link>
          </>
        )}

        {isFacultyOrStudent && (
          <Link to="/evaluations/list" className={`nav-item${getActiveClass('/evaluations/list')}`}>
            <EvaluationIcon />
            <span>View My Evaluations</span>
          </Link>
        )}


        <Link to="/profile" className={`nav-item${getActiveClass('/profile')}`}>
          <ProfileIcon />
          <span>Profile</span>
        </Link>
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <img src={userProfile?.profile_image_url || 'https://via.placeholder.com/40'} alt="Profile" />
          <div className="user-info">
            <span className="user-name">{userProfile?.full_name}</span>
            <span className="user-role">{userProfile?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;