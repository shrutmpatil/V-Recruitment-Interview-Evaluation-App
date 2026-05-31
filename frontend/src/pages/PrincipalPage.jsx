// frontend/src/pages/PrincipalPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import '../assets/Dashboard.css';
import { TrendingUp, FileText } from 'lucide-react';

function QuickActionCard({ icon: Icon, title, description, onClick, variant = 'default' }) {
    const getStyle = () => {
      if (variant === 'primary') {
        return { background: 'linear-gradient(135deg, #ff3b5f 0%, #ff6b8a 100%)', color: '#fff' };
      }
      return { background: '#fff', color: '#333' };
    };
    return (
      <div className="action-card" onClick={onClick} style={{ ...getStyle(), padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: variant === 'primary' ? 'rgba(255,255,255,0.2)' : '#ffeef2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: variant === 'primary' ? '#fff' : '#ff3b5f' }}>
          <Icon size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 4px 0' }}>{title}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0, color: variant === 'primary' ? 'rgba(255,255,255,0.9)' : '#666' }}>{description}</p>
        </div>
        <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>→</span>
      </div>
    );
}

function PrincipalPage({ userProfile }) {
    const navigate = useNavigate();
  return (
    <div className="app-container">
      <Sidebar userProfile={userProfile} />
      <div className="main-content">
        <main className="dashboard-main">
            <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
              <h1>Welcome, Principal {userProfile?.full_name?.split(' ')[0]}! 👋</h1>
              <p>Here are your available actions.</p>
            </header>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <QuickActionCard
                    icon={FileText}
                    title="View My Evaluations"
                    description="Access evaluations assigned to you"
                    onClick={() => navigate('/evaluations/list')}
                    variant="primary"
                />
                <QuickActionCard
                    icon={TrendingUp}
                    title="View Analytics"
                    description="Review overall candidate results"
                    onClick={() => navigate('/analytics')}
                />
              </div>
            </div>
          </main>
      </div>
    </div>
  );
}

export default PrincipalPage;