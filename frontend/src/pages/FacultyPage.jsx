// frontend/src/pages/FacultyPage.jsx
import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import StudentDashboard from '../components/StudentDashboard.jsx'; // Reuse the student dashboard
import '../assets/Dashboard.css';

function FacultyPage({ userProfile }) {
  return (
    <div className="app-container">
      <Sidebar userProfile={userProfile} />
      <div className="main-content">
        <StudentDashboard userProfile={userProfile} />
      </div>
    </div>
  );
}

export default FacultyPage;