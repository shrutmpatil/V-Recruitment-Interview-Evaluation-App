// frontend/src/pages/EvaluationListPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import { useNavigate } from 'react-router-dom';
import '../assets/Dashboard.css';
import styles from './Auth.module.css';
import Sidebar from '../components/Sidebar.jsx';

const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const TimeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const DateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

const cleanTime = (timeStr) => {
    if (!timeStr) return '00:00:00';
    return timeStr.split('+')[0];
};

function EvaluationListPage({ userProfile }) {
    const [schedules, setSchedules] = useState([]);
    const [completedScheduleIds, setCompletedScheduleIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSchedulesAndEvaluations = async () => {
            setLoading(true);

            // Fetch evaluations completed by the current user
            const { data: completedEvals, error: evalsError } = await supabase
                .from('evaluations')
                .select('schedule_id')
                .eq('evaluator_uid', userProfile.uid);

            if (evalsError) {
                setError(evalsError.message);
            } else {
                setCompletedScheduleIds(new Set(completedEvals.map(e => e.schedule_id)));
            }

            // Fetch all scheduled events for the user
            const { data, error: schedulesError } = await supabase
                .from('schedules')
                .select('*, candidate:users!schedules_candidate_id_fkey(full_name, profile_image_url)')
                .contains('evaluator_uids', [userProfile.uid])
                .eq('status', 'Scheduled')
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            if (schedulesError) {
                setError(schedulesError.message);
                console.error(schedulesError);
            } else {
                setSchedules(data || []);
            }
            setLoading(false);
        };

        fetchSchedulesAndEvaluations();
        const intervalId = setInterval(fetchSchedulesAndEvaluations, 60000);
        return () => clearInterval(intervalId);
    }, [userProfile.uid]);

    const isEvaluationLive = (schedule) => {
        const now = new Date();
        const cleanStartTime = cleanTime(schedule.start_time);

        const [year, month, day] = schedule.date.split('-').map(Number);
        const [hour, minute, second] = cleanStartTime.split(':').map(Number);

        const start = new Date(year, month - 1, day, hour, minute, second);
        if (isNaN(start.getTime())) return false;

        const end = new Date(start.getTime() + schedule.duration_minutes * 60000);
        const enableTime = new Date(start.getTime() - 15 * 60000);

        return now >= enableTime && now <= end;
    };

    const handleEvaluateClick = (scheduleId) => {
        navigate(`/evaluate/${scheduleId}/disclaimer`);
    };

    if (loading) return <div className="app-container"><Sidebar userProfile={userProfile} /><div className="main-content"><p>Loading scheduled evaluations...</p></div></div>;
    if (error) return <div className="app-container"><Sidebar userProfile={userProfile} /><div className="main-content"><p className={styles.error}>{error}</p></div></div>;

    return (
        <div className="app-container">
            <Sidebar userProfile={userProfile} />
            <div className="main-content">
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>My Scheduled Evaluations</h1>
                    </header>

                    <div className="student-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {schedules.length === 0 ? (
                            <div className="placeholder-card">
                                <h3>No active evaluations scheduled for you.</h3>
                                <p>Evaluations you are assigned to will appear here once scheduled.</p>
                            </div>
                        ) : (
                            schedules.map(schedule => {
                                const isLive = isEvaluationLive(schedule);
                                const isCompleted = completedScheduleIds.has(schedule.id);
                                let statusText = `Starts at ${cleanTime(schedule.start_time).substring(0, 5)}`;
                                if (new Date(schedule.date) < new Date().setHours(0, 0, 0, 0)) statusText = "Event Ended";

                                return (
                                    <div
                                        key={schedule.id}
                                        className="action-card"
                                        style={{
                                            display: 'grid', gridTemplateColumns: '80px 1fr 150px',
                                            alignItems: 'center',
                                            border: isLive && !isCompleted ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                                            backgroundColor: isLive && !isCompleted ? '#f1f8e9' : (isCompleted ? '#e0e0e0' : '#fff'),
                                            opacity: isCompleted ? 0.7 : 1
                                        }}
                                    >
                                        <img
                                            src={schedule.candidate?.profile_image_url || 'https://via.placeholder.com/80'}
                                            alt="Candidate"
                                            style={{ width: '60px', height: '60px', borderRadius: '8px', marginRight: '1rem', objectFit: 'cover' }}
                                        />
                                        <div className="action-text">
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>{schedule.candidate?.full_name || 'N/A'}</h3>
                                            <p style={{ color: '#ff3b5f', fontWeight: 600 }}>{schedule.event_name} ({schedule.round_type})</p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
                                                <span><LocationIcon /> {schedule.location || schedule.mode}</span>
                                                <span><DateIcon /> {schedule.date}</span>
                                                <span><TimeIcon /> {schedule.duration_minutes} mins</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {isCompleted ? (
                                                <button
                                                    disabled
                                                    className={styles.authButton}
                                                    style={{ width: '100%', backgroundColor: '#9E9E9E', cursor: 'not-allowed' }}
                                                >
                                                    Completed
                                                </button>
                                            ) : isLive ? (
                                                <button
                                                    onClick={() => handleEvaluateClick(schedule.id)}
                                                    className={styles.authButton}
                                                    style={{ width: '100%', padding: '10px 0', fontSize: '0.9rem', backgroundColor: '#4CAF50', cursor: 'pointer' }}
                                                >
                                                    Evaluate Now
                                                </button>
                                            ) : (
                                                <span style={{ color: '#999', fontWeight: '500', fontSize: '0.9rem' }}>{statusText}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default EvaluationListPage;