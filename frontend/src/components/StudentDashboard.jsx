// src/components/EvaluationForm.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/Dashboard.css';
import { FileText, BookOpen } from 'lucide-react'; // Changed icons for clarity

function StudentDashboard({ userProfile }) {
  const navigate = useNavigate();
  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <h1>Welcome, {userProfile?.full_name?.split(' ')[0]}!</h1>
        <p>Ready to evaluate? Here are your assigned sessions.</p>
      </header>

      <div className="dashboard-content student-view" style={{marginTop: '2rem'}}>
        <div className="action-card primary" onClick={() => navigate('/evaluations/list')}>
            <div className="action-icon"><FileText /></div>
            <div className="action-text">
              <h3>My Upcoming Evaluations</h3>
              <p>See faculty demos you need to attend and evaluate.</p>
            </div>
            <span>&gt;</span>
        </div>
        <div className="action-card" onClick={() => navigate('/past-feedback')}>
            <div className="action-icon"><BookOpen /></div>
            <div className="action-text">
              <h3>Past Feedback</h3>
              <p>Review all of your previous evaluation submissions.</p>
            </div>
            <span>&gt;</span>
        </div>
      </div>
    </main>
  );
}

export default StudentDashboard;