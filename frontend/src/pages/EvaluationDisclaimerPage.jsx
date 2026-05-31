// src/pages/EvaluationDisclaimerPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../assets/Dashboard.css';
import styles from './Auth.module.css';

function EvaluationDisclaimerPage() {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const fetchScheduleDetails = async () => {
            // FIX: Ensure scheduleId is valid before querying
            if (!scheduleId) {
                setError("Schedule ID is missing from the URL.");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    id, event_name, round_type, duration_minutes,
                    candidate:candidate_id (full_name)
                `)
                .eq('id', scheduleId)
                .single();

            if (error) {
                // Log the actual error and set a descriptive user message
                console.error("Supabase Error fetching schedule:", error);
                setError(`Schedule not found or data load error: ${error.message}. (Check RLS on 'schedules' and 'users' tables)`);
                setSchedule(null); 
            } else {
                setSchedule(data);
            }
            setLoading(false);
        };
        fetchScheduleDetails();
    }, [scheduleId]);

    const handleStartEvaluation = () => {
        if (agreed) {
            // Navigate directly to the form page to start the timer
            navigate(`/evaluate/${scheduleId}/start`);
        } else {
            alert("You must agree to the instructions to proceed.");
        }
    };

    if (loading) return <div className={styles.authContainer}>Loading Instructions...</div>;
    
    // FIX: Render a clearly visible error container if the schedule data failed to load
    // The schedule object must contain the candidate name for the main content to render.
    if (error || !schedule || !schedule.candidate?.full_name) return (
        <div className={styles.authContainer}>
            <div className={styles.authForm} style={{ maxWidth: '800px', textAlign: 'center', padding: '30px' }}>
                <h2 style={{ color: '#ff3b5f', textAlign: 'center' }}>Loading Error</h2>
                <p className={styles.error} style={{fontSize: '1rem', padding: '20px', backgroundColor: '#ffeef2'}}>
                    {error || `Could not retrieve schedule data for ID ${scheduleId}. This usually means one of two things: 1) The Schedule ID is invalid, OR 2) RLS policies on the 'schedules' or 'users' tables are blocking the data. Please check your Supabase RLS configuration.`}
                </p>
            </div>
        </div>
    );
    

    const roundGuidelines = {
        'Classroom Round': [
            'Focus on delivery, clarity, and engagement.',
            'Your score will directly contribute to the Appearance, Communication, and Psychometric sections.',
            'Use the comment box for qualitative feedback on teaching methodology.'
        ],
        'HR Round': [
            'Assess cultural fit, behavioral traits, and professional history.',
            'Be objective and link scores directly to the candidate\'s answers to HR questions.'
        ],
        'Technical Round': [
            'Evaluate core skills, problem-solving, and system design expertise.',
            'Ensure the candidate\'s coding/technical knowledge meets the job description.'
        ],
        'Final Round': [
            'Review all previous scores. Focus on overall suitability and final recommendation.'
        ]
    };
    
    return (
        <div className="app-container">
            <div className="main-content">
                <div className={styles.authContainer} style={{ minHeight: 'unset' }}>
                    <div className={styles.authForm} style={{ maxWidth: '800px', textAlign: 'left', padding: '30px' }}>
                        <h2 style={{ color: '#ff3b5f', textAlign: 'center' }}>Evaluation Instructions & Disclaimer</h2>
                        <p style={{ textAlign: 'center', color: '#555', marginBottom: '20px' }}>
                            **Event:** {schedule.event_name} ({schedule.round_type}) for **{schedule.candidate.full_name}**
                        </p>

                        <h3 style={{ fontSize: '1.2rem', marginTop: '10px', color: '#333' }}>General Guidelines</h3>
                        <ul style={{ listStyleType: 'disc', marginLeft: '20px', color: '#666' }}>
                            <li>The evaluation session is strictly **{schedule.duration_minutes} minutes** long. Once the timer starts, you cannot pause it.</li>
                            <li>Ensure you have a stable connection. Unsubmitted evaluations after the timer expires will be **automatically saved as incomplete**.</li>
                            <li>Score honestly and based only on the observed performance.</li>
                        </ul>

                        <h3 style={{ fontSize: '1.2rem', marginTop: '20px', color: '#333' }}>{schedule.round_type} Focus</h3>
                        <ul style={{ listStyleType: 'square', marginLeft: '20px', color: '#555' }}>
                            {roundGuidelines[schedule.round_type]?.map((line, index) => (
                                <li key={index}>{line}</li>
                            ))}
                        </ul>

                        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                                />
                                <span style={{ fontSize: '1rem', color: '#333' }}>
                                    I have read the instructions and agree to conduct the evaluation in the allotted time.
                                </span>
                            </label>
                        </div>

                        <button 
                            onClick={handleStartEvaluation} 
                            disabled={!agreed}
                            className={styles.authButton} 
                            style={{ width: '100%', marginTop: '30px' }}
                        >
                            Start Evaluation (Timer will begin now)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EvaluationDisclaimerPage;