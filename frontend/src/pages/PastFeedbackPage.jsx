// frontend/src/pages/PastFeedbackPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import Sidebar from '../components/Sidebar.jsx';
import '../assets/Dashboard.css';
import styles from './Auth.module.css';

const FeedbackCard = ({ evaluation }) => {
    const overallPercentage = evaluation.total_max_score > 0
        ? Math.round((evaluation.total_score / evaluation.total_max_score) * 100)
        : 0;

    const getScoreColor = (percentage) => {
        if (percentage >= 80) return '#4CAF50'; // Green
        if (percentage >= 60) return '#FFC107'; // Amber
        return '#F44336'; // Red
    };

    return (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#333' }}>{evaluation.candidate?.full_name || 'N/A'}</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#ff3b5f', fontWeight: 'bold' }}>{evaluation.round_type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(overallPercentage) }}>
                        {overallPercentage}%
                    </p>
                    <p style={{ margin: 0, color: '#666' }}>
                        ({evaluation.total_score}/{evaluation.total_max_score})
                    </p>
                </div>
            </div>
            <div>
                <h4 style={{ color: '#555', marginBottom: '0.5rem' }}>Your Comments:</h4>
                {evaluation.qualitative_comments && evaluation.qualitative_comments.length > 0 ? (
                    evaluation.qualitative_comments.map((comment, index) => (
                        <p key={index} style={{ margin: '0 0 0.5rem 0', paddingLeft: '1rem', borderLeft: '3px solid #f0f0f0', color: '#666', fontStyle: 'italic' }}>
                           "{comment.comment}"
                        </p>
                    ))
                ) : (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>No comments were provided for this evaluation.</p>
                )}
            </div>
        </div>
    );
};

function PastFeedbackPage({ userProfile }) {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPastFeedback = async () => {
            if (!userProfile) return;
            setLoading(true);

            const { data, error } = await supabase
                .from('evaluations')
                .select(`
                    *,
                    candidate:candidate_uid (full_name)
                `)
                .eq('evaluator_uid', userProfile.uid)
                .order('submission_time', { ascending: false });

            if (error) {
                setError(`Failed to fetch feedback: ${error.message}`);
                console.error(error);
            } else {
                setEvaluations(data.map(e => ({
                    ...e,
                    qualitative_comments: typeof e.qualitative_comments === 'string'
                        ? JSON.parse(e.qualitative_comments)
                        : e.qualitative_comments
                })));
            }
            setLoading(false);
        };

        fetchPastFeedback();
    }, [userProfile]);

    return (
        <div className="app-container">
            <Sidebar userProfile={userProfile} />
            <div className="main-content">
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <h1 style={{ fontSize: '2rem' }}>My Past Evaluations</h1>
                        <p>A record of all the evaluations you have submitted.</p>
                    </header>

                    {loading && <p>Loading your feedback history...</p>}
                    {error && <p className={styles.error}>{error}</p>}

                    {!loading && evaluations.length === 0 && (
                        <div className="placeholder-card" style={{marginTop: '2rem'}}>
                            <h3>No Feedback History Found</h3>
                            <p>You have not submitted any evaluations yet. They will appear here once you do.</p>
                        </div>
                    )}

                    {!loading && evaluations.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            {evaluations.map(evaluation => (
                                <FeedbackCard key={evaluation.id} evaluation={evaluation} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default PastFeedbackPage;