// frontend/src/pages/IntervieweeListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import Sidebar from '../components/Sidebar.jsx';
import styles from './Auth.module.css';
import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react'; // Added FileText icon

// --- Helper Components (ProfileDetail, Section, InterviewProgressBar remain the same) ---

const ProfileDetail = ({ label, value }) => (
    <div>
        <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{value || 'N/A'}</p>
    </div>
);

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#ff3b5f', borderBottom: '2px solid #ffeef2', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{title}</h3>
        {children}
    </div>
);

const InterviewProgressBar = ({ schedules, finalVerdict }) => {
    const roundSequence = ['HR Round', 'Technical Round', 'Classroom Round', 'Final Round'];
    const activeRounds = schedules.filter(s => s.status !== 'Cancelled' && s.status !== 'Pending Approval').map(s => ({ type: s.round_type, status: s.status }));
    const completedRounds = activeRounds.filter(r => r.status === 'Completed').map(r => r.type);

    const getRoundStatus = (round) => {
        if (completedRounds.includes(round)) return 'completed';
        if (activeRounds.some(r => r.type === round && r.status === 'Scheduled')) return 'scheduled';
        const roundIndex = roundSequence.indexOf(round);
        if (round === 'Final Round') {
            const hasHR = completedRounds.includes('HR Round');
            const hasTechnical = completedRounds.includes('Technical Round');
            const hasClassroom = completedRounds.includes('Classroom Round');
            if (hasHR && hasTechnical && hasClassroom) return 'ready';
        }
        if (roundIndex > 0) {
            const prevRound = roundSequence[roundIndex - 1];
            if (completedRounds.includes(prevRound) && !completedRounds.includes(round)) return 'scheduled';
        }
        return 'pending';
    };

    const getColor = (status) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'ready': return '#FF9800'; 
            case 'scheduled': return '#2196F3';
            default: return '#ccc';
        }
    };

    const renderStage = (round, index) => {
        const status = getRoundStatus(round);
        const color = getColor(status);
        
        return (
            <div key={round} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    background: color, 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 5px auto',
                    zIndex: 2, 
                    position: 'relative'
                }}>
                    {status === 'completed' ? <CheckCircle size={18} /> : (status === 'scheduled' || status === 'ready') ? <Clock size={18} /> : <XCircle size={18} />}
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#333', margin: 0 }}>{round.replace('Round', '').trim()}</p>
                
                {index < roundSequence.length - 1 && (
                    <div style={{ 
                        position: 'absolute', 
                        top: '14px', 
                        left: '50%', 
                        width: 'calc(100% - 30px)', 
                        height: '3px', 
                        background: color, 
                        zIndex: 1,
                        transform: `translateX(15px)`
                    }} />
                )}
            </div>
        );
    };

    const recommendationColor = finalVerdict === 'Recommended' ? '#4CAF50' : finalVerdict === 'Not Recommended' ? '#ff3b5f' : finalVerdict === 'Waitlist' ? '#FFC107' : '#999';

    return (
        <Section title="Interview Progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative', paddingTop: '10px' }}>
                {roundSequence.map(renderStage)}
            </div>
             <div style={{ background: recommendationColor, color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                Final Verdict: {finalVerdict || 'Pending Final Round/Review'}
            </div>
        </Section>
    );
};


const ProfileModal = ({ profile, schedules, onClose }) => {
    if (!profile) return null;
    
    const parseSafe = (data) => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse JSON field:", e);
                return [];
            }
        }
        return data;
    };

    const academicDetails = parseSafe(profile.academic_details) || [];
    const experienceDetails = parseSafe(profile.experience_details) || [];
    const selfRatings = parseSafe(profile.self_ratings) || {};
    const computerSkills = parseSafe(profile.computer_skills) || {};
    const languagesKnown = parseSafe(profile.languages_known) || {};

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>{profile.first_name} {profile.surname}'s Profile</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
                    
                    <InterviewProgressBar schedules={schedules} finalVerdict={profile.final_verdict} />
                    
                    <Section title="Personal Details">
                        {/* NEW: Resume View Button (Point 4) */}
                         {profile.resume_url && (
                             <a 
                                href={profile.resume_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ 
                                    textDecoration: 'none', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    padding: '10px 20px', 
                                    background: '#ff3b5f', 
                                    color: 'white', 
                                    borderRadius: '8px', 
                                    fontWeight: 'bold', 
                                    marginBottom: '1.5rem'
                                }}
                            >
                                <FileText size={20} style={{ marginRight: '8px' }}/> View Candidate Resume
                            </a>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <ProfileDetail label="Position Applied For" value={profile.position_applied_for} />
                            <ProfileDetail label="Email" value={profile.email} />
                            <ProfileDetail label="Mobile" value={profile.mobile} />
                            <ProfileDetail label="Date of Birth" value={profile.date_of_birth} />
                            <ProfileDetail label="Marital Status" value={profile.marital_status} />
                            <ProfileDetail label="Nationality" value={profile.nationality} />
                            <ProfileDetail label="Aadhar No." value={profile.aadhar_card_no} />
                            <ProfileDetail label="PAN No." value={profile.pan_no} />
                        </div>
                    </Section>
                    
                    <Section title="Academic History">
                        {academicDetails.length > 0 ? academicDetails.map((item, index) => (
                            <div key={index} style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <strong>{item.qualification}</strong>: {item.course || 'N/A'} from {item.institute || 'N/A'} ({item.year || 'N/A'}) - {item.percentage || 'N/A'}
                            </div>
                        )) : <p>No academic details provided.</p>}
                    </Section>

                    <Section title="Experience History">
                        {experienceDetails.length > 0 ? experienceDetails.map((item, index) => (
                            <div key={index} style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <strong>{item.company}</strong> as {item.designation || 'N/A'} ({item.duration || 'N/A'})
                            </div>
                        )) : <p>No experience details provided.</p>}
                    </Section>

                     <Section title="Self-Rating Competency">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                           {Object.keys(selfRatings).length > 0 ? Object.entries(selfRatings).map(([key, value]) => (
                               <ProfileDetail key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={value} />
                           )) : <p>No self-ratings provided.</p>}
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

function IntervieweeListPage({ userProfile }) {
    const [interviewees, setInterviewees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [profileSchedules, setProfileSchedules] = useState([]); 

    const fetchInterviewees = useCallback(async () => {
        setLoading(true);
        // Fetch only basic user data initially
        const { data, error } = await supabase
            .from('users')
            .select('uid, full_name, profile_image_url') 
            .eq('role', 'candidate')
            .order('full_name', { ascending: true });

        if (error) {
            setError(error.message);
            console.error(error);
        } else {
            setInterviewees(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInterviewees();
    }, [fetchInterviewees]);

    const handleViewProfile = async (userId) => {
        setLoading(true);
        setError('');
        setSelectedProfile(null);
        setProfileSchedules([]);

        // 1. Fetch Candidate Profile (from candidate_profiles, NO JOIN to bypass schema issue)
        const { data: profileData, error: profileError } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', userId) 
            .single();
            
        // 2. Fetch User Info (Name and Image) separately
        const { data: userInfo, error: userError } = await supabase
            .from('users')
            .select('full_name, profile_image_url')
            .eq('uid', userId)
            .single();

        // 3. Fetch schedules
        const { data: schedulesData, error: schedulesError } = await supabase
            .from('schedules')
            .select('round_type, status')
            .eq('candidate_id', userId);

        if (profileError) {
            // NOTE: The RLS policy for candidate_profiles needs to allow SELECT by authenticated users.
            setError(`Could not fetch profile: ${profileError.message}. RLS/Profile existence issue.`);
        } else if (userError) {
            setError(`Could not fetch candidate name/image: ${userError.message}`);
        } else if (schedulesError) {
             setError(`Could not fetch schedule data for progress bar: ${schedulesError.message}`);
        } else {
            // Merge the data client-side
            const fullProfile = {
                ...profileData,
                full_name: userInfo?.full_name, // Merged from separate fetch
                profile_image_url: userInfo?.profile_image_url, // Merged from separate fetch
            };
            setSelectedProfile(fullProfile);
            setProfileSchedules(schedulesData || []);
        }
        setLoading(false);
    };

    return (
        <div className="app-container">
            <Sidebar userProfile={userProfile} />
            <div className="main-content">
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <h1 style={{ fontSize: '2rem' }}>Interviewee Profiles</h1>
                        <p>Browse all candidates who have applied for positions.</p>
                    </header>

                    {loading && <p>Loading profiles...</p>}
                    {error && <p className={styles.error}>{error}</p>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                        {interviewees.map(user => (
                            <div key={user.uid} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <img 
                                    src={user.profile_image_url || 'https://via.placeholder.com/60'} 
                                    alt="Profile" 
                                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }}
                                />
                                <h3 style={{ marginTop: 0, marginBottom: '5px' }}>{user.full_name || 'No Name'}</h3>
                                <p style={{ color: '#666', fontSize: '0.9rem' }}>Role: Candidate</p>
                                <button
                                    onClick={() => handleViewProfile(user.uid)}
                                    className={styles.authButton}
                                    style={{ width: 'auto', padding: '8px 24px', marginTop: '10px' }}
                                >
                                    View Full Profile
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <ProfileModal 
                profile={selectedProfile} 
                schedules={profileSchedules}
                onClose={() => {
                    setSelectedProfile(null);
                    setProfileSchedules([]);
                }} 
            />
        </div>
    );
}

export default IntervieweeListPage;