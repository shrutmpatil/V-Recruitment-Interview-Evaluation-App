// frontend/src/pages/StudentPage.jsx
import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import StudentDashboard from '../components/StudentDashboard.jsx';
import '../assets/Dashboard.css';

function StudentPage({ userProfile }) {
  return (
    <div className="app-container">
      <Sidebar userProfile={userProfile} />
      <div className="main-content">
        <StudentDashboard userProfile={userProfile} />
      </div>
    </div>
  );
}

export default StudentPage;