// frontend/src/pages/HomePage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

function HomePage({ userProfile }) {
  const renderDashboard = () => {
    switch (userProfile?.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'principal':
        return <Navigate to="/principal" replace />;
      case 'professor':
        return <Navigate to="/faculty" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <div>Welcome! Your dashboard is being prepared.</div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar userProfile={userProfile} />
      <div className="main-content">
        {renderDashboard()}
      </div>
    </div>
  );
}

export default HomePage;