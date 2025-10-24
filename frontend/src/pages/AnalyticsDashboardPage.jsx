// src/pages/AnalyticsDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import '../assets/Dashboard.css';
import styles from './Auth.module.css';
import Sidebar from '../components/Sidebar.jsx';
import { Download, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = "http://127.0.0.1:5000"; 

// --- NEW: Simple Mock Pie Chart Component (Point 2) ---
const MockScoreChart = ({ overallAvg }) => {
    const scoreColor = overallAvg > 80 ? '#4CAF50' : overallAvg > 60 ? '#ffc107' : '#ff3b5f';
    const percent = Math.round(overallAvg);

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Overall Score Distribution</h3>
            <div style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                margin: '0 auto',
                // Simple CSS trick for a pie chart
                background: `conic-gradient(${scoreColor} 0% ${percent}%, #f0f0f0 ${percent}% 100%)`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ position: 'absolute', width: '120px', height: '120px', background: 'white', borderRadius: '50%' }}>
                    <p style={{ margin: 0, lineHeight: '120px', fontSize: '1.5rem', fontWeight: 'bold', color: scoreColor }}>{percent}%</p>
                </div>
            </div>
            <p style={{ marginTop: '15px', fontWeight: 'bold' }}>Overall Average: {percent}%</p>
        </div>
    );
};
// --- End Mock Pie Chart Component ---


// --- Detailed Dimension Breakdown Structure (Mock Data/Structure Enhancement) ---
// This function structures the comprehensive breakdown needed for the detailed report view.
const getDetailedBreakdown = (analytics) => {
    const breakdown = [];
    if (!analytics || analytics.individualResponses.length === 0) return breakdown;

    analytics.individualResponses.forEach(response => {
        const quantitative = response.quantitative_scores;
        // Group by module (e.g., Appearance, Technical 1)
        for (const module in quantitative) {
            // Check if quantitative is a structure with sections (which it should be)
            if (quantitative[module] && typeof quantitative[module] === 'object') {
                // Mocking detailed breakdown based on the assumed structure in EvaluationForm.jsx
                // For simplicity here, we'll just show the module score and comment.
                const comment = response.comments.find(c => c.round === module)?.comment || 'No module-specific comment.';
                
                breakdown.push({
                    module: module,
                    score: quantitative[module].score,
                    max: quantitative[module].max,
                    comment: comment,
                    evaluator: response.evaluator,
                });
            }
        }
    });
    
    // Simple deduplication/grouping for a cleaner dashboard view:
    // In a real application, this would average all evaluator scores per module.
    const groupedBreakdown = {};
    breakdown.forEach(item => {
        if (!groupedBreakdown[item.module]) {
            groupedBreakdown[item.module] = { totalScore: 0, totalMax: 0, count: 0, comments: [] };
        }
        groupedBreakdown[item.module].totalScore += item.score;
        groupedBreakdown[item.module].totalMax += item.max;
        groupedBreakdown[item.module].count += 1;
        if (item.comment !== 'No module-specific comment.') {
             groupedBreakdown[item.module].comments.push(item.comment);
        }
    });
    
    return Object.keys(groupedBreakdown).map(module => ({
        module,
        score: groupedBreakdown[module].totalScore,
        max: groupedBreakdown[module].totalMax,
        average: Math.round((groupedBreakdown[module].totalScore / groupedBreakdown[module].totalMax) * 100),
        combinedComment: groupedBreakdown[module].comments.join(' | ') || 'No consensus comments.',
    }));
};
// --- End Detailed Breakdown Structure ---


// --- Core Data Fetch Logic (fetchRealAnalytics) ---
const fetchRealAnalytics = async (candidateId) => {
    // 1. Fetch all evaluations
    const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select(`
            round_type, total_score, total_max_score, quantitative_scores, 
            qualitative_comments, evaluator:evaluator_uid(full_name) 
        `)
        .eq('candidate_uid', candidateId)
        .eq('is_complete', true)
        .order('round_type'); 

    if (error) throw error;
    if (evaluations.length === 0) return {
        groupedByRound: [], individualResponses: [], aiSummary: "No completed evaluations found.", recommendation: 'N/A', comments: []
    };

    // 2. Aggregate Data
    const aggregatedData = {};
    const allComments = [];
    const individualResponses = [];
    
    evaluations.forEach(evaluation => { 
        const round = evaluation.round_type;
        const score = evaluation.total_score;
        const maxScore = evaluation.total_max_score;

        if (!aggregatedData[round]) {
            aggregatedData[round] = { totalScore: 0, totalMaxScore: 0, count: 0 };
        }
        aggregatedData[round].totalScore += score;
        aggregatedData[round].totalMaxScore += maxScore;
        aggregatedData[round].count += 1;
        
        individualResponses.push({
            id: evaluation.id,
            round: round,
            evaluator: evaluation.evaluator?.full_name || 'Unknown Evaluator',
            score: score,
            max: maxScore,
            // Safely parse JSON strings for nested data
            quantitative_scores: typeof evaluation.quantitative_scores === 'string' ? JSON.parse(evaluation.quantitative_scores) : evaluation.quantitative_scores,
            comments: typeof evaluation.qualitative_comments === 'string' ? JSON.parse(evaluation.qualitative_comments) : evaluation.qualitative_comments
        });

        allComments.push(...(typeof evaluation.qualitative_comments === 'string' ? JSON.parse(evaluation.qualitative_comments) : evaluation.qualitative_comments));
    });

    // Transform for display (Average Score by Round)
    const groupedByRound = Object.keys(aggregatedData).map(round => {
        const data = aggregatedData[round];
        const avgScore = (data.totalScore / data.totalMaxScore) * 100;
        return { round, avg_score: Math.round(avgScore), score: data.totalScore, max_score: data.totalMaxScore };
    });
    
    const totalAggregatedScore = groupedByRound.reduce((acc, curr) => acc + curr.score, 0);
    const totalMaxAggregatedScore = groupedByRound.reduce((acc, curr) => acc + curr.max_score, 0);
    const overallAvg = totalMaxAggregatedScore > 0 ? (totalAggregatedScore / totalMaxAggregatedScore) * 100 : 0;
    const recommendation = overallAvg > 80 ? 'Recommended' : overallAvg > 60 ? 'Waitlist' : 'Not Recommended';

    // Fetch AI Summary (Mock)
    let aiSummary = "Summary generation is currently offline or failed.";
    try {
        const summaryResponse = await fetch(`${BACKEND_URL}/api/summarize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comments: allComments }) });
        const summaryData = await summaryResponse.json();
        aiSummary = summaryData.summary || aiSummary;
    } catch (e) { console.warn("AI Summary generation failed:", e.message); }

    return {
        groupedByRound,
        individualResponses,
        aiSummary,
        recommendation,
        totalAggregatedScore: totalAggregatedScore,
        totalMaxAggregatedScore: totalMaxAggregatedScore,
        overallAvg: overallAvg, // NEW: Pass average for the chart (Point 2)
    };
};
// --- End Core Data Fetch Logic ---


function AnalyticsDashboardPage({ userProfile }) {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportStatus, setReportStatus] = useState({ state: 'idle', message: '' });

    // ... (fetchCandidates, fetchAnalytics, handleCandidateSelect functions remain the same) ...
    const fetchCandidates = useCallback(async () => {
        const { data, error } = await supabase
            .from('users')
            .select('uid, full_name, profile_image_url')
            .eq('role', 'candidate')
            .order('full_name', { ascending: true });
        
        if (error) {
            setError(error.message);
        } else {
            setCandidates(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCandidates();
    }, [fetchCandidates]);


    const fetchAnalytics = async (candidateId) => {
        setLoading(true);
        setError(null);
        setAnalytics(null);
        const candidate = candidates.find(c => c.uid === candidateId);
        setSelectedCandidate(candidate);

        try {
            const result = await fetchRealAnalytics(candidateId);
            setAnalytics(result);
        } catch (err) {
            setError(err.message);
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCandidateSelect = (e) => {
        const id = e.target.value;
        setSelectedCandidateId(id);
        if (id) {
            fetchAnalytics(id);
        } else {
            setAnalytics(null);
            setSelectedCandidate(null);
        }
    };

    // --- Report Export Logic (Kept as is) ---
    const handleExportReport = async (exportType) => {
        if (!selectedCandidateId) {
            setReportStatus({ state: 'error', message: 'Please select a candidate first.' });
            return;
        }

        setReportStatus({ state: 'loading', message: `Generating ${exportType.toUpperCase()} report...` });
        setError(null);

        try {
            const endpoint = exportType === 'pdf' ? '/api/report?candidate_id=' : '/api/report/excel?candidate_id=';
            const response = await fetch(`${BACKEND_URL}${endpoint}${selectedCandidateId}`); 
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned status ${response.status}. Message: ${errorText.substring(0, 100)}...`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `VRecruitment_Report_${selectedCandidateId}.${exportType === 'excel' ? 'csv' : 'pdf'}`; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            setReportStatus({ state: 'success', message: `${exportType.toUpperCase()} Report downloaded successfully!` });

        } catch (err) {
            setReportStatus({ state: 'error', message: `Report generation failed: ${err.message}` });
        } finally {
            setTimeout(() => setReportStatus({ state: 'idle', message: '' }), 5000);
        }
    };

    // --- NEW: Detailed Dimension Breakdown Renderer ---
    const renderDetailedBreakdown = () => {
        const breakdownData = getDetailedBreakdown(analytics);
        if (breakdownData.length === 0) return <p style={{ color: '#666', padding: '15px' }}>No detailed dimension scores available from evaluations.</p>;

        return (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '30px' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Detailed Dimension Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {breakdownData.map((item, index) => (
                        <div key={item.module} style={{ border: '1px solid #f0f0f0', padding: '10px', borderRadius: '8px' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>{item.module}: <span style={{ color: '#ff3b5f' }}>{item.average}%</span></p>
                            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>Comments: {item.combinedComment}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- NEW: Compact Round Scores Renderer (Point 2) ---
    const renderCompactRoundScores = () => {
        if (!analytics || analytics.groupedByRound.length === 0) return null;

        return (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Round Scores Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {analytics.groupedByRound.map(data => (
                        <div key={data.round} style={{ borderLeft: '4px solid #ff3b5f', paddingLeft: '10px', background: '#fafafa', padding: '10px', borderRadius: '4px' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>{data.round}</p>
                            <p style={{ margin: 0, color: '#ff3b5f', fontSize: '1.2rem', fontWeight: 700 }}>{data.avg_score}%</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    // --- Individual Responses Renderer (Keep as previous step) ---
    const renderIndividualResponses = () => {
        if (!analytics || analytics.individualResponses.length === 0) {
            return <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '30px' }}>No individual responses found.</div>;
        }
        
        return (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '30px' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Individual Evaluator Responses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {analytics.individualResponses.map((response, index) => (
                        <div key={response.id || index} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                            <p style={{ fontWeight: 'bold', color: '#ff3b5f', margin: '0 0 10px 0' }}>{response.round} by {response.evaluator} ({response.score}/{response.max})</p>
                            
                            <h4 style={{ fontSize: '1rem', color: '#333', margin: '10px 0 5px 0' }}>Comments:</h4>
                            {response.comments?.length > 0 ? (
                                response.comments.map((comment, cIndex) => (
                                    <p key={cIndex} style={{ margin: '5px 0', fontSize: '0.9rem', color: '#666', borderLeft: '3px solid #f0f0f0', paddingLeft: '10px' }}>
                                        **{comment.round}**: {comment.comment}
                                    </p>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: '#999' }}>No comments provided.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const recommendationColor = analytics?.recommendation === 'Recommended' ? '#4CAF50' : analytics?.recommendation === 'Waitlist' ? '#ffc107' : '#ff3b5f';
    const overallScoreAvg = analytics?.overallAvg || 0; // Get overall average for the chart

    return (
        <div className="app-container">
            <Sidebar userProfile={userProfile} />
            <div className="main-content">
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <h1>Recruitment Analytics Dashboard</h1>
                        <p>View consolidated, clustered, and individual evaluation results.</p>
                    </header>

                    {/* Candidate Selector */}
                    <div style={{ margin: '20px 0', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ marginBottom: '15px' }}>Select Candidate for Analysis</h3>
                        <select onChange={handleCandidateSelect} value={selectedCandidateId || ''} className={styles.authInput} style={{ width: '400px' }}>
                            <option value="">-- Select Interviewee (Candidate) --</option>
                            {candidates.map(c => (
                                <option key={c.uid} value={c.uid}>{c.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    {loading && selectedCandidateId && !error && <div className={styles.authContainer}>Fetching Analytics...</div>}
                    
                    {analytics && !loading && !error && (
                        <>
                            {/* Overall Score Card (Mocking the 93/100 box from the report image) */}
                            <div style={{ 
                                background: '#fff', 
                                padding: '2rem', 
                                borderRadius: '12px', 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '2rem',
                                marginBottom: '2rem'
                            }}>
                                <img 
                                    src={selectedCandidate?.profile_image_url || 'https://via.placeholder.com/80'} 
                                    alt="Candidate" 
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                    <h2 style={{ margin: 0, color: '#333' }}>{selectedCandidate?.full_name}</h2>
                                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>Software Engineer - Frontend (Example Position)</p>
                                    <div style={{ 
                                        display: 'inline-block', 
                                        background: recommendationColor, 
                                        color: 'white', 
                                        padding: '5px 10px', 
                                        borderRadius: '20px',
                                        marginTop: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        {analytics.recommendation}
                                    </div>
                                </div>
                                <div style={{ marginLeft: 'auto', textAlign: 'right', borderLeft: '1px solid #eee', paddingLeft: '2rem' }}>
                                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#333', margin: 0 }}>
                                        {analytics.totalAggregatedScore}/{analytics.totalMaxAggregatedScore}
                                    </p>
                                    <p style={{ margin: 0, color: '#ff3b5f', fontWeight: 'bold' }}>Overall Score</p>
                                </div>
                            </div>
                            
                            <div className="dashboard-content" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '0' }}>
                                <div className="main-column">
                                    {renderCompactRoundScores()}
                                    
                                    <h2 style={{ fontSize: '1.5rem', margin: '0 0 15px 0' }}>Detailed Dimension Breakdown</h2>
                                    {renderDetailedBreakdown()}

                                    <h2 style={{ fontSize: '1.5rem', margin: '30px 0 15px 0' }}>AI-Powered Qualitative Summary</h2>
                                    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', borderLeft: '4px solid #ff3b5f', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <p style={{ fontStyle: 'italic', color: '#555' }}>{analytics.aiSummary}</p>
                                    </div>

                                    {renderIndividualResponses()}
                                </div>

                                <div className="actions-column">
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Overall Status</h2>
                                    
                                    {/* Pie Chart Implementation (Point 2) */}
                                    <MockScoreChart 
                                        overallAvg={overallScoreAvg}
                                    />

                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', marginTop: '30px' }}>Report Export & Controls</h2>
                                    <p style={{ marginBottom: '15px', color: '#555' }}>Download full, detailed report:</p>
                                    
                                    {reportStatus.message && (
                                        <p className={styles.error} style={{ 
                                            backgroundColor: reportStatus.state === 'error' ? '#ffebee' : reportStatus.state === 'success' ? '#e9ffe9' : '#ebf5ff',
                                            color: reportStatus.state === 'error' ? '#ff3b5f' : reportStatus.state === 'success' ? 'green' : '#333',
                                            border: `1px solid ${reportStatus.state === 'error' ? '#ff3b5f' : reportStatus.state === 'success' ? 'green' : '#333'}`
                                        }}>{reportStatus.message}</p>
                                    )}

                                    <button onClick={() => handleExportReport('pdf')} className={styles.authButton} style={{ marginBottom: '10px', backgroundColor: '#007bff' }}>
                                        <Download size={18} style={{ marginRight: '5px' }} /> Download PDF Report
                                    </button>
                                    <button onClick={() => handleExportReport('excel')} className={styles.authButton} style={{ marginBottom: '30px', backgroundColor: '#28a745' }}>
                                        <Download size={18} style={{ marginRight: '5px' }} /> Download Excel Report
                                    </button>
                                    
                                    <div style={{ 
                                        padding: '20px', 
                                        background: '#fff', 
                                        borderRadius: '12px', 
                                        border: `2px solid ${recommendationColor}`,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ fontWeight: 700, color: '#333', margin: '0 0 5px 0' }}>Final Recommendation:</p>
                                        <p style={{ color: recommendationColor, fontWeight: 'bold', fontSize: '1.5rem', margin: 0 }}>{analytics.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default AnalyticsDashboardPage;