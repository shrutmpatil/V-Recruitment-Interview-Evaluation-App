// frontend/src/components/EvaluationForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/Dashboard.css';
import styles from '../pages/Auth.module.css';

// --- ICONS and DATA STRUCTURES remain unchanged ---
const AppearanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CommunicationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const PsychometricIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
const HRIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6M23 11h-6"></path></svg>;
const TechnicalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-3.78 3.78a1 1 0 0 0-1.41 0L.3 15.34a1 1 0 0 0 0 1.41l2.58 2.58a1 1 0 0 0 1.41 0l.9-.9a1 1 0 0 0 0-1.41l-1.6-1.6a1 1 0 0 0-1.41 0l-1.6 1.6a1 1 0 0 0 0 1.41l1.41 1.41a1 1 0 0 0 1.41 0l3.77-3.77a6 6 0 0 1 7.94-7.94z"></path></svg>;

const AssessmentModules = {
    'Appearance': { icon: AppearanceIcon, questions: [
        { key: 'attire', text: 'Professional Attire Standards' },
        { key: 'grooming', text: 'Personal Grooming Excellence' },
        { key: 'posture', text: 'Professional Posture & Demeanor' },
        { key: 'overall', text: 'Outstanding Overall Presentation' },
    ]},
    'Communication': { icon: CommunicationIcon, questions: [
        { key: 'verbal', text: 'Excellent Verbal Communication' },
        { key: 'listening', text: 'Active Listening Confidence' },
        { key: 'nonverbal', text: 'Professional Non-Verbal Communication' },
        { key: 'coherence', text: 'Clear & Coherent Expression' },
        { key: 'confidence', text: 'Communication Confidence' },
    ]},
    'Psychometric': { icon: PsychometricIcon, questions: [
        { key: 'problem_solving', text: 'Excellent Problem-Solving Abilities' },
        { key: 'adaptability', text: 'High Adaptability & Flexibility' },
        { key: 'teamwork', text: 'Outstanding Teamwork Skills' },
        { key: 'leadership', text: 'Strong Leadership Potential' },
        { key: 'stress_mgmt', text: 'Excellent Stress Management' },
        { key: 'emotional_iq', text: 'High Emotional Intelligence' },
    ]},
    'HR Assessment': { icon: HRIcon, questions: [
        { key: 'background', text: 'Background Verification Excellence' },
        { key: 'cultural_fit', text: 'Cultural Fit & Values Alignment' },
        { key: 'work_ethic', text: 'Strong Work Ethics & Integrity' },
        { key: 'behavioral', text: 'Positive Behavioral Traits' },
        { key: 'interpersonal', text: 'Excellent Interpersonal Skills' },
        { key: 'history', text: 'Outstanding Professional History' },
    ]},
    'Technical 1': { icon: TechnicalIcon, questions: [
        { key: 'core_skills', text: 'Core Technical Skills Mastery' },
        { key: 'advanced_problem_solving', text: 'Advanced Problem-Solving Ability' },
        { key: 'quality_code', text: 'High-Quality Code Standards' },
        { key: 'system_design', text: 'System Design & Architecture' },
        { key: 'algorithms', text: 'Algorithms & Data Structure Expertise' },
        { key: 'debugging', text: 'Debugging & Testing Proficiency' },
    ]},
    'Technical 2': { icon: TechnicalIcon, questions: [
        { key: 'cloud', text: 'Cloud Technologies & DevOps' },
        { key: 'leadership_mentor', text: 'Technical Leadership & Mentoring' },
    ]},
};

const CommentBox = ({ tab, label, formData, handleCommentChange, customStyles }) => (
    <div style={{ marginTop: '2rem' }}>
        <label style={{ fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
        <textarea
            rows="4"
            placeholder="Provide detailed observations about the candidate's performance and areas for improvement."
            value={formData[tab]?.comment || ''}
            onChange={(e) => handleCommentChange(tab, e.target.value)}
            className={customStyles.authInput}
        />
    </div>
);


function EvaluationForm({ userProfile }) {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState(0);
    const [isTiming, setIsTiming] = useState(false);
    const [activeTab, setActiveTab] = useState(null);
    const [formData, setFormData] = useState({});
    const [submissionStatus, setSubmissionStatus] = useState({ state: 'idle', message: '' });
    const [finalVerdict, setFinalVerdict] = useState('');

    const roundToModules = {
        'Classroom Round': ['Appearance', 'Communication', 'Psychometric'],
        'HR Round': ['HR Assessment'],
        'Technical Round': ['Technical 1', 'Technical 2'],
        'Final Round': ['Summary'],
    };

    const fetchSchedule = useCallback(async () => {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                id, round_type, duration_minutes, event_name,
                candidate:candidate_id (full_name, uid)
            `)
            .eq('id', scheduleId)
            .single();

        if (error) {
            setSubmissionStatus({ state: 'error', message: "Error loading schedule: " + error.message });
            return;
        }

        setSchedule(data);
        const modules = roundToModules[data.round_type] || [];
        setActiveTab(modules[0] || 'Summary');

        const initialFormData = {};
        modules.forEach(moduleName => {
            initialFormData[moduleName] = {
                comment: '',
                ...(AssessmentModules[moduleName]?.questions.reduce((acc, q) => ({ ...acc, [q.key]: 0 }), {}) || {})
            };
        });
        setFormData(initialFormData);

        const durationSeconds = data.duration_minutes * 60;
        setTimer(durationSeconds);
        setIsTiming(true);
        setLoading(false);
    }, [scheduleId]);

    const handleSubmit = useCallback(async (e, isAutoSubmit = false) => {
        if (e) e.preventDefault();
        setIsTiming(false);
        setSubmissionStatus({ state: 'submitting', message: isAutoSubmit ? "Time expired. Auto-submitting..." : "Submitting Evaluation..." });

        if (schedule.round_type === 'Final Round') {
            setSubmissionStatus({ state: 'error', message: "Final Round is for verdict only." });
            setIsTiming(true);
            return;
        }

        let totalScore = 0;
        let totalMaxScore = 0;
        const quantitative_scores = {};
        const qualitative_comments = [];

        const activeModules = roundToModules[schedule.round_type] || [];
        for (const moduleName of activeModules) {
            const moduleData = formData[moduleName] || {};
            let moduleScore = 0;
            let maxModuleScore = 0;

            const moduleConfig = AssessmentModules[moduleName];

            if (moduleConfig) {
                moduleConfig.questions.forEach(q => {
                    const score = moduleData[q.key] || 0;
                    if (typeof score === 'number') {
                        moduleScore += score;
                        maxModuleScore += 10;
                    }
                });
            }

            totalScore += moduleScore;
            totalMaxScore += maxModuleScore;
            quantitative_scores[moduleName] = { score: moduleScore, max: maxModuleScore };

            if (moduleData.comment) {
                qualitative_comments.push({
                    round: moduleName,
                    comment: moduleData.comment,
                });
            }
        }

        try {
            const { error: insertError } = await supabase
                .from('evaluations')
                .insert({
                    schedule_id: scheduleId,
                    evaluator_uid: userProfile.uid,
                    candidate_uid: schedule.candidate.uid,
                    round_type: schedule.round_type,
                    submission_time: new Date().toISOString(),
                    time_remaining_seconds: timer,
                    quantitative_scores: quantitative_scores,
                    qualitative_comments: qualitative_comments,
                    total_score: totalScore,
                    total_max_score: totalMaxScore,
                    is_complete: !isAutoSubmit,
                });

            if (insertError) throw insertError;

            setSubmissionStatus({
                state: 'success',
                message: isAutoSubmit ? "Auto-submission successful. Redirecting..." : "Evaluation submitted successfully! Redirecting..."
            });

            setTimeout(() => navigate('/'), 1500);

        } catch (err) {
            setSubmissionStatus({ state: 'error', message: "Submission failed: " + err.message });
            setIsTiming(true);
        }
    }, [formData, navigate, schedule, scheduleId, timer, userProfile]);


    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    useEffect(() => {
        // FIX: The ReferenceError occurs here because handleSubmit is not fully defined
        // when React checks the dependency array [isTiming, timer, handleSubmit].
        // The fix is to remove handleSubmit from the dependency array.
        
        if (!isTiming || timer <= 0) {
            if (timer === 0 && isTiming) {
                handleSubmit(null, true);
            }
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isTiming, timer]); // CORRECTED: Removed handleSubmit from dependencies


    const handleScoreChange = (tab, key, value) => {
        setFormData(prev => ({
            ...prev,
            [tab]: {
                ...(prev[tab] || {}),
                [key]: value
            }
        }));
    };

    const handleCommentChange = (tab, value) => {
        setFormData(prev => ({
            ...prev,
            [tab]: {
                ...(prev[tab] || {}),
                comment: value
            }
        }));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinalVerdict = async (e) => {
        e.preventDefault();
        setSubmissionStatus({ state: 'submitting', message: "Submitting Final Verdict..." });

        if (!finalVerdict) {
            setSubmissionStatus({ state: 'error', message: "Please select a final verdict before submitting." });
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from('candidate_profiles')
                .update({ final_verdict: finalVerdict })
                .eq('user_id', schedule.candidate.uid);

            if (updateError) throw updateError;

            const { error: scheduleUpdateError } = await supabase.from('schedules')
                    .update({ status: 'Completed' })
                    .eq('id', scheduleId);

            if (scheduleUpdateError) {
                 console.error("Failed to update schedule status to Completed:", scheduleUpdateError);
                 setSubmissionStatus({ state: 'warning', message: "Final Verdict submitted. WARNING: Failed to update schedule status." });
            }

            setSubmissionStatus({ state: 'success', message: "Final Verdict recorded successfully! Redirecting to Home..." });

            setTimeout(() => navigate('/'), 1500);

        } catch (err) {
            setSubmissionStatus({ state: 'error', message: "Final Verdict submission failed: " + err.message });
        }
    };


    if (loading || !schedule) return <div className={styles.authContainer}>Preparing Form...</div>;

    const activeModules = roundToModules[schedule.round_type] || [];

    // --- RENDER LOGIC (No changes needed below this line) ---

    const ScoreInput = ({ tab, qKey, text }) => {
        const currentTabScores = formData[tab] || {};
        const score = currentTabScores[qKey] || 0;

        return (
            <div className="score-input" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                <p style={{ fontWeight: 600, color: '#333' }}>{text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#888' }}>Strongly Disagree</span>
                    <span style={{ fontSize: '0.9rem', color: '#ff3b5f' }}>Strongly Agree ({score}/10)</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="10"
                    value={score}
                    onChange={(e) => handleScoreChange(tab, qKey, parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#ff3b5f' }}
                />
            </div>
        );
    };

    const renderTabContent = (tabName) => {
        if (tabName === 'Summary') {
            const isAdminOrPrincipal = userProfile.role === 'admin' || userProfile.role === 'principal';
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ color: '#ff3b5f' }}>Final Recommendation</h2>
                    <p style={{ margin: '1rem 0' }}>This is the Final Round / Admin Review Tab. Select the final verdict for the candidate.</p>
                    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 600 }}>Final Verdict:</p>
                        <select
                            className={styles.authInput}
                            style={{ maxWidth: '300px' }}
                            value={finalVerdict}
                            onChange={(e) => setFinalVerdict(e.target.value)}
                            disabled={!isAdminOrPrincipal}
                        >
                            <option value="">Select Final Verdict</option>
                            <option value="Recommended">Recommended</option>
                            <option value="Not Recommended">Not Recommended</option>
                            <option value="Waitlist">Waitlist</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleFinalVerdict}
                            className={styles.authButton}
                            style={{
                                backgroundColor: isAdminOrPrincipal ? '#4CAF50' : '#ccc',
                                marginTop: '20px',
                                width: 'auto',
                                cursor: isAdminOrPrincipal ? 'pointer' : 'not-allowed'
                            }}
                            disabled={!isAdminOrPrincipal || !finalVerdict || submissionStatus.state === 'submitting'}
                        >
                            Submit Final Verdict
                        </button>
                        {!isAdminOrPrincipal && <p style={{color: '#ff3b5f', fontSize: '0.8rem', marginTop: '10px'}}>Only Admin/Principal can submit the Final Verdict.</p>}
                    </div>
                </div>
            );
        }

        const module = AssessmentModules[tabName];
        if (!module) return <div>Module not found.</div>;

        return (
            <div style={{ padding: '2rem' }}>
                <h3 style={{ borderBottom: '2px solid #ff3b5f', paddingBottom: '10px', marginBottom: '20px', color: '#333' }}>
                    {tabName} Assessment (Likert Scale)
                </h3>
                {module.questions.map(q => (
                    <ScoreInput
                        key={q.key}
                        tab={tabName}
                        qKey={q.key}
                        text={q.text}
                    />
                ))}
                <CommentBox
                    tab={tabName}
                    label="Additional Comments"
                    formData={formData}
                    handleCommentChange={handleCommentChange}
                    customStyles={styles}
                />
            </div>
        );
    };

    return (
        <div className="app-container">
            <div className="main-content">
                <main className="dashboard-main" style={{ maxWidth: '1000px' }}>
                    <header className="dashboard-header">
                        <h1 style={{ color: submissionStatus.state === 'error' ? '#ff3b5f' : '#333' }}>
                            Interview Evaluation: {schedule.event_name}
                        </h1>
                        <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Candidate: **{schedule.candidate.full_name}** | Round: {schedule.round_type}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: timer <= 60 ? '#ff3b5f' : '#4CAF50' }}>
                                Time Remaining: {formatTime(timer)}
                            </span>
                        </p>
                    </header>

                    {submissionStatus.state !== 'idle' && (
                        <div className={styles.error} style={{
                            backgroundColor: submissionStatus.state === 'success' ? '#e9ffe9' : '#ffebee',
                            color: submissionStatus.state === 'success' ? 'green' : '#ff3b5f',
                            border: `1px solid ${submissionStatus.state === 'success' ? 'green' : '#ff3b5f'}`,
                            fontWeight: 'bold'
                        }}>
                            {submissionStatus.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                            {activeModules.map(tab => {
                                const ModuleConfig = AssessmentModules[tab];
                                if (!ModuleConfig) return null;
                                const ModuleIcon = ModuleConfig.icon;

                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '15px 25px',
                                            border: 'none',
                                            background: activeTab === tab ? '#ffeef2' : 'transparent',
                                            color: activeTab === tab ? '#ff3b5f' : '#555',
                                            borderBottom: activeTab === tab ? '3px solid #ff3b5f' : '3px solid transparent',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <ModuleIcon />
                                        <span style={{ marginLeft: '8px' }}>{tab}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="tab-content">
                            {renderTabContent(activeTab)}
                        </div>

                        {schedule.round_type !== 'Final Round' && (
                            <div style={{ padding: '2rem', borderTop: '1px solid #eee', textAlign: 'right' }}>
                                <button
                                    type="submit"
                                    disabled={submissionStatus.state === 'submitting' || timer === 0}
                                    className={styles.authButton}
                                    style={{ width: 'auto', padding: '10px 30px', backgroundColor: '#4CAF50' }}
                                >
                                    {timer === 0 ? 'Time Expired' : 'Submit Evaluation'}
                                </button>
                            </div>
                        )}
                    </form>
                </main>
            </div>
        </div>
    );
}

export default EvaluationForm;