// frontend/src/pages/AdminPage.jsx
import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import AdminDashboard from '../components/AdminDashboard.jsx';
import '../assets/Dashboard.css';

function AdminPage({ userProfile }) {
  return (
    <div className="app-container">
      <Sidebar userProfile={userProfile} />
      <div className="main-content">
        <AdminDashboard userProfile={userProfile} />
      </div>
    </div>
  );
}

export default AdminPage;