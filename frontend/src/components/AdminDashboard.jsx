// frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../assets/Dashboard.css';
import styles from '../pages/Auth.module.css';
// Added Upload icon for file input
import { Calendar as CalendarIcon, Clock, TrendingUp, Users, UserPlus, FileText, Check, X, Trash2, PlusCircle, Upload, User } from 'lucide-react';
import { v4 } from 'uuid'; // CORRECTED IMPORT: v4 is a named export function

// --- Reusable Components ---

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <div className="stat-card" style={{
      background: '#fff', padding: '1.5rem', borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem'
    }}>
      <div style={{
        width: '50px', height: '50px', borderRadius: '12px', background: color || '#ffeef2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b5f'
      }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#333', margin: 0 }}>{value}</h3>
        <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{title}</p>
        {subtitle && <p style={{ color: '#999', fontSize: '0.8rem', margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

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

// ... (AcademicRow, RatingSelector, selfRatingCriteria components remain the same) ...

const AcademicRow = ({ qualification, data, index, onChange, styles }) => (
  <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa' }}>
    <h4 style={{ marginTop: 0, color: '#333' }}>{qualification}</h4>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
      <input type="text" name="course" placeholder="Name of the course" value={data.course} onChange={(e) => onChange(index, e)} className={styles.authInput} />
      <input type="text" name="institute" placeholder="Name of the Institute" value={data.institute} onChange={(e) => onChange(index, e)} className={styles.authInput} />
      <input type="text" name="year" placeholder="Year of passing" value={data.year} onChange={(e) => onChange(index, e)} className={styles.authInput} />
      <input type="text" name="percentage" placeholder="Percentage / CGPA" value={data.percentage} onChange={(e) => onChange(index, e)} className={styles.authInput} />
      <input type="text" name="medium" placeholder="Medium of instruction" value={data.medium} onChange={(e) => onChange(index, e)} className={styles.authInput} />
      <input type="text" name="specialization" placeholder="Specialization" value={data.specialization} onChange={(e) => onChange(index, e)} className={styles.authInput} />
    </div>
  </div>
);

const RatingSelector = ({ value, onRate }) => {
  const ratings = ['Outstanding', 'Good', 'Satisfactory', 'Barely adequate'];
  return (<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}> {ratings.map(rating => (<button key={rating} type="button" onClick={() => onRate(rating)} style={{ padding: '8px 16px', border: `1px solid ${value === rating ? '#ff3b5f' : '#ccc'}`, background: value === rating ? '#ff3b5f' : '#fff', color: value === rating ? '#fff' : '#333', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}> {rating} </button>))} </div>);
};

const selfRatingCriteria = [
  { competency: 'Attitudinal', key: 'creativity', criteria: 'Creativity and Innovation', description: 'Originality/new ideas/improvements' }, { competency: 'Attitudinal', key: 'confidence', criteria: 'Self Confidence', description: 'Ability to take on unfamiliar tasks' }, { competency: 'Attitudinal', key: 'quality', criteria: 'Concern for high quality', description: 'Working towards excellence in all tasks' }, { competency: 'Attitudinal', key: 'performance', criteria: 'Performance (Achieves Goals)', description: 'A bias for action / Result Oriented' }, { competency: 'Attitudinal', key: 'failures', criteria: 'Dealing with failures', description: 'The ability to not be rattled' }, { competency: 'Behavioral', key: 'opportunity', criteria: 'Acting on opportunity', description: 'The ability to recognize opportunities' }, { competency: 'Behavioral', key: 'initiative', criteria: 'Initiative (Pro-activeness)', description: 'To be a self-starter / drive to complete the job' }, { competency: 'Behavioral', key: 'risk', criteria: 'Risk taking', description: 'Should have the courage to take risks' }, { competency: 'Behavioral', key: 'drive', criteria: 'Drive and Energy', description: 'Should be ever enthusiastic' }, { competency: 'Behavioral', key: 'persistence', criteria: 'Persistence', description: 'The strength to not give up' }, { competency: 'Behavioral', key: 'ownership', criteria: 'Ownership', 'description': 'Responsibility towards assets of the Company' }, { competency: 'Managerial', key: 'technical', criteria: 'Technical knowledge', description: 'Knowledge of the job' }, { competency: 'Managerial', key: 'goalSetting', criteria: 'Goal setting', description: 'Clarity in objectives' }, { competency: 'Managerial', key: 'leadership', criteria: 'Leadership', description: 'Thought leadership, strategy, ability to delegate' }, { competency: 'Managerial', key: 'infoSeeking', criteria: 'Information seeking', description: 'Should seek out and update information' }, { competency: 'Managerial', key: 'planning', criteria: 'Systematic planning', description: 'Should work to a well-considered plan' }, { competency: 'Managerial', key: 'social', criteria: 'Social skill (working in a Team)', description: 'Interpersonal skills and willingness to work with others' }, { competency: 'Managerial', key: 'completion', criteria: 'Work completion (Result Focus)', description: 'Handling a job end to end' },
];

function IntervieweeForm({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [academicDetails, setAcademicDetails] = useState([{ qualification: 'X', course: '', institute: '', year: '', percentage: '', medium: '', specialization: '' }, { qualification: 'XII', course: '', institute: '', year: '', percentage: '', medium: '', specialization: '' }, { qualification: 'Graduation / Diploma', course: '', institute: '', year: '', percentage: '', medium: '', specialization: '' }, { qualification: 'Post-Graduation', course: '', institute: '', year: '', percentage: '', medium: '', specialization: '' }, { qualification: 'Other Qualification', course: '', institute: '', year: '', percentage: '', medium: '', specialization: '' }]);
  const [experienceDetails, setExperienceDetails] = useState([{ company: '', designation: '', duration: '', reason: '' }]);
  const [familyDetails, setFamilyDetails] = useState([{ name: '', relation: '', dob: '', occupation: '', income: '' }]);
  const [computerSkills, setComputerSkills] = useState({ ms_office: '', tally: '', other: '' });
  const [otherSkillText, setOtherSkillText] = useState(''); // State for custom skill text
  const [languages, setLanguages] = useState({ english: [], marathi: [], hindi: [], other: [] });
  const [additionalInfo, setAdditionalInfo] = useState({ relatives: '', associations: '', extraCurricular: '', habits: '', otherSkills: '' });
  const [reportingOfficers, setReportingOfficers] = useState([{ companyName: '', name: '', designation: '', mobile: '', email: '' }, { companyName: '', name: '', designation: '', mobile: '', email: '' }]);
  const [selfRating, setSelfRating] = useState({});
  const [resumeFile, setResumeFile] = useState(null); // State for actual file object (Point 4)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = "http://127.0.0.1:5000";

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAcademicChange = (index, e) => { const updated = [...academicDetails]; updated[index][e.target.name] = e.target.value; setAcademicDetails(updated); };
  const handleLanguageChange = (lang, ability) => { const current = languages[lang] || []; const updated = current.includes(ability) ? current.filter(a => a !== ability) : [...current, ability]; setLanguages(prev => ({ ...prev, [lang]: updated })); };
  const handleOfficerChange = (index, e) => { const updated = [...reportingOfficers]; updated[index][e.target.name] = e.target.value; setReportingOfficers(updated); }
  const addRow = (setter, state, newRow) => setter([...state, newRow]);
  const removeRow = (setter, state, index) => setter(state.filter((_, i) => i !== index));

  // Function to handle file selection (Point 4)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size exceeds 5MB limit.');
        setResumeFile(null);
        e.target.value = null; // Clear file input
    } else {
        setError('');
        setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) { setStep(step + 1); return; }
    setLoading(true); setError('');

    // --- 0. Resume File Upload (Point 4) ---
    let uploadedResumeUrl = null;
    if (resumeFile) {
        try {
            const fileExtension = resumeFile.name.split('.').pop();
            // CORRECTED USAGE: v4() is the function from 'uuid'
            const fileName = `${v4()}_${formData.first_name || 'candidate'}_${formData.surname || 'resume'}.${fileExtension}`; 
            
            // Upload the file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('resumes') // Uses the confirmed 'resumes' bucket
                .upload(fileName, resumeFile, {
                    cacheControl: '3600',
                    upsert: false 
                });

            if (uploadError) throw new Error(uploadError.message);
            
            // Get the public URL for the uploaded file
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(fileName);
            
            uploadedResumeUrl = urlData.publicUrl;

        } catch (err) {
            setError(`Failed to upload resume: ${err.message}. Please check Supabase Storage bucket ('resumes') and RLS policy.`);
            setLoading(false);
            return;
        }
    }
    
    // Process custom skill text (Point 3)
    const updatedComputerSkills = { ...computerSkills };
    if (computerSkills.other && otherSkillText) {
        updatedComputerSkills.other = `${computerSkills.other}: ${otherSkillText}`; 
    } else if (computerSkills.other) {
         // If a rating is selected but no text, clear the rating and prompt error
         if (!otherSkillText.trim()) {
             setError("Please specify the custom skill if you select a rating for 'Other Custom Skill'.");
             setLoading(false);
             return;
         }
    }
    
    try {
      const fullPayload = { 
          ...formData, 
          academic_details: academicDetails, 
          experience_details: experienceDetails, 
          computer_skills: updatedComputerSkills, 
          languages_known: languages, 
          additional_info: additionalInfo, 
          reporting_officers: reportingOfficers, 
          self_ratings: selfRating, 
          family_details: familyDetails,
          resume_url: uploadedResumeUrl, // Use the uploaded URL or null
      };
      
      const res = await fetch(`${BACKEND_URL}/api/candidate/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullPayload) });
      const data = await res.json();
      if (!res.ok || data.error) { throw new Error(data.supabase_error || data.error || 'An unknown error occurred.'); }
      
      onSuccess({ uid: data.uid, message: "Candidate Profile created successfully!" });
      onClose();

    } catch (err) {
      setError(`Failed to add candidate: ${err.message}`);
    } finally { setLoading(false); }
  };

  let lastCompetency = "";

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '1000px', width: '100%', height: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>New Application for Employment</h2>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>Step {step} of 4</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>×</button>
        </div>
        <form id="main-form" onSubmit={handleSubmit} style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
          {error && <p className={styles.error}>{error}</p>}

          {step === 1 && (
            <>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>I. Personal Details</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="text" name="position_applied_for" placeholder="Position Applied For *" value={formData.position_applied_for || ''} onChange={handleChange} className={styles.authInput} required />
                  <input type="text" name="first_name" placeholder="First Name *" value={formData.first_name || ''} onChange={handleChange} className={styles.authInput} required />
                  <input type="text" name="father_or_husband_name" placeholder="Husband/Father's Name *" value={formData.father_or_husband_name || ''} onChange={handleChange} className={styles.authInput} required />
                  <input type="text" name="surname" placeholder="Surname *" value={formData.surname || ''} onChange={handleChange} className={styles.authInput} required />
                </div>
                <textarea name="current_address" placeholder="Current Address *" value={formData.current_address || ''} onChange={handleChange} className={styles.authInput} rows="2" required />
                <textarea name="permanent_address" placeholder="Permanent Address *" value={formData.permanent_address || ''} onChange={handleChange} className={styles.authInput} rows="2" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="tel" name="mobile" placeholder="Mobile *" value={formData.mobile || ''} onChange={handleChange} className={styles.authInput} required />
                  <input type="email" name="email" placeholder="Email ID *" value={formData.email || ''} onChange={handleChange} className={styles.authInput} required />
                </div>
                
                {/* FILE INPUT: Resume Upload (Point 4) */}
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label htmlFor="resume-upload" style={{ fontWeight: 'bold', color: '#ff3b5f', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Upload size={20} style={{ marginRight: '5px' }} /> Manual Resume Upload (PDF/Doc, Max 5MB)
                    </label>
                    <input 
                        id="resume-upload"
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange} 
                        style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: resumeFile ? '#4CAF50' : '#888' }}>
                        {resumeFile ? `File Selected: ${resumeFile.name}` : 'No file selected'}
                    </span>
                </div>
                
              </fieldset>

              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>II. Other Details</legend>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div><label>Date of Birth *</label><input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} className={styles.authInput} required /></div>
                  <select name="marital_status" value={formData.marital_status || ''} onChange={handleChange} className={styles.authInput} required><option value="">Marital Status *</option><option value="Single">Single</option><option value="Married">Married</option><option value="Other">Other</option></select>
                  <select name="gender" value={formData.gender || ''} onChange={handleChange} className={styles.authInput} required><option value="">Gender *</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                  <input type="text" name="religion" placeholder="Religion" value={formData.religion || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="caste" placeholder="Caste" value={formData.caste || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="category" placeholder="Category (OPEN/SC/ST...)" value={formData.category || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="nationality" placeholder="Nationality" value={formData.nationality || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="blood_group" placeholder="Blood Group" value={formData.blood_group || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="allergies" placeholder="Allergies (If Any)" value={formData.allergies || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="disability" placeholder="Disability (If Any)" value={formData.disability || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="aadhar_card_no" placeholder="Aadhar Card No." value={formData.aadhar_card_no || ''} onChange={handleChange} className={styles.authInput} />
                  <input type="text" name="pan_no" placeholder="PAN No." value={formData.pan_no || ''} onChange={handleChange} className={styles.authInput} />
                </div>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>III. Academic Details</legend>
                {academicDetails.map((detail, index) => <AcademicRow key={index} qualification={detail.qualification} data={detail} index={index} onChange={handleAcademicChange} styles={styles} />)}
              </fieldset>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>IV. Experience Details</legend>
                {experienceDetails.map((exp, index) => (
                  <div key={index} style={{ position: 'relative', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <input type="text" placeholder="Company Name" value={exp.company} onChange={e => { const updated = [...experienceDetails]; updated[index].company = e.target.value; setExperienceDetails(updated); }} className={styles.authInput} />
                      <input type="text" placeholder="Designation" value={exp.designation} onChange={e => { const updated = [...experienceDetails]; updated[index].designation = e.target.value; setExperienceDetails(updated); }} className={styles.authInput} />
                      <input type="text" placeholder="Duration (mm/yyyy - mm/yyyy)" value={exp.duration} onChange={e => { const updated = [...experienceDetails]; updated[index].duration = e.target.value; setExperienceDetails(updated); }} className={styles.authInput} />
                      <input type="text" placeholder="Reason for Leaving" value={exp.reason} onChange={e => { const updated = [...experienceDetails]; updated[index].reason = e.target.value; setExperienceDetails(updated); }} className={styles.authInput} />
                    </div>
                    {experienceDetails.length > 1 && <button type="button" onClick={() => removeRow(setExperienceDetails, experienceDetails, index)} style={{ position: 'absolute', top: 5, right: 5, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 color="#ff3b5f" size={18} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => addRow(setExperienceDetails, experienceDetails, { company: '', designation: '', duration: '', reason: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid #ff3b5f', color: '#ff3b5f', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}><PlusCircle size={18} /> Add Experience</button>
              </fieldset>
            </>
          )}

          {step === 3 && (
            <>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>VI. Computer Skills</legend>
                {['ms_office', 'tally'].map(skill => (
                  <div key={skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', flexWrap: 'wrap' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{skill.replace('_', ' ')}</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {['Basic', 'Good', 'Excellent'].map(level => <label key={level}><input type="radio" name={skill} value={level} checked={computerSkills[skill] === level} onChange={e => setComputerSkills({ ...computerSkills, [skill]: level })} /> {level}</label>)}
                    </div>
                  </div>
                ))}
                
                {/* Custom Skill Input (Point 3) */}
                <div key="other_skill" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold' }}>Other Custom Skill *</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['Basic', 'Good', 'Excellent'].map(level => (
                                <label key={level}>
                                    <input 
                                        type="radio" 
                                        name="other" 
                                        value={level} 
                                        checked={computerSkills.other === level} 
                                        onChange={e => setComputerSkills({ ...computerSkills, other: level })} 
                                    /> {level}
                                </label>
                            ))}
                        </div>
                    </div>
                    {computerSkills.other && (
                         <input 
                            type="text" 
                            placeholder="Specify other skill (e.g., Python, AWS, Figma) - Required if rating selected"
                            value={otherSkillText}
                            onChange={(e) => setOtherSkillText(e.target.value)}
                            className={styles.authInput}
                            style={{marginTop: '0.5rem'}}
                            required
                         />
                    )}
                </div>

              </fieldset>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>VII. Languages Known</legend>
                <table width="100%" style={{ borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9f9' }}><th>Language</th><th>Read</th><th>Write</th><th>Speak</th></tr></thead>
                  <tbody>
                    {['english', 'marathi', 'hindi', 'other'].map(lang => (
                      <tr key={lang} style={{ textAlign: 'center', borderTop: '1px solid #eee' }}>
                        <td style={{ fontWeight: 'bold', textTransform: 'capitalize', padding: '0.5rem' }}>{lang}</td>
                        <td><input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={(languages[lang] || []).includes('read')} onChange={() => handleLanguageChange(lang, 'read')} /></td>
                        <td><input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={(languages[lang] || []).includes('write')} onChange={() => handleLanguageChange(lang, 'write')} /></td>
                        <td><input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={(languages[lang] || []).includes('speak')} onChange={() => handleLanguageChange(lang, 'speak')} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </fieldset>
            </>
          )}

          {step === 4 && (
            <>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>IX. Additional Information</legend>
                <textarea name="relatives" placeholder="Relatives working in this firm? (Name and department)" value={additionalInfo.relatives} onChange={(e) => setAdditionalInfo({ ...additionalInfo, relatives: e.target.value })} className={styles.authInput} rows="2" />
                <textarea name="associations" placeholder="Member of any family scheme/club/associations?" value={additionalInfo.associations} onChange={(e) => setAdditionalInfo({ ...additionalInfo, associations: e.target.value })} className={styles.authInput} rows="2" />
                <textarea name="extraCurricular" placeholder="Extra-curricular activities" value={additionalInfo.extraCurricular} onChange={(e) => setAdditionalInfo({ ...additionalInfo, extraCurricular: e.target.value })} className={styles.authInput} rows="2" />
                <textarea name="habits" placeholder="Any habit like Smoking, Drinking, etc." value={additionalInfo.habits} onChange={(e) => setAdditionalInfo({ ...additionalInfo, habits: e.target.value })} className={styles.authInput} rows="2" />
                <textarea name="otherSkills" placeholder="Any other skill that will highlight your profile" value={additionalInfo.otherSkills} onChange={(e) => setAdditionalInfo({ ...additionalInfo, otherSkills: e.target.value })} className={styles.authInput} rows="2" />
              </fieldset>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>Details of Reporting Officers</legend>
                {[0, 1].map(index => (
                  <div key={index} style={{ marginBottom: '1rem', borderBottom: index === 0 ? '1px solid #eee' : 'none', paddingBottom: '1rem' }}>
                    <h4>Reference {index + 1}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <input type="text" name="companyName" placeholder="Company Name" value={reportingOfficers[index].companyName} onChange={(e) => handleOfficerChange(index, e)} className={styles.authInput} />
                      <input type="text" name="name" placeholder="Name" value={reportingOfficers[index].name} onChange={(e) => handleOfficerChange(index, e)} className={styles.authInput} />
                      <input type="text" name="designation" placeholder="Designation" value={reportingOfficers[index].designation} onChange={(e) => handleOfficerChange(index, e)} className={styles.authInput} />
                      <input type="tel" name="mobile" placeholder="Mobile No." value={reportingOfficers[index].mobile} onChange={(e) => handleOfficerChange(index, e)} className={styles.authInput} />
                      <input type="email" name="email" placeholder="Email Id" value={reportingOfficers[index].email} onChange={(e) => handleOfficerChange(index, e)} className={styles.authInput} />
                    </div>
                  </div>
                ))}
              </fieldset>
              <fieldset style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <legend style={{ fontWeight: 'bold', color: '#ff3b5f', padding: '0 0.5rem' }}>Self-Rating Competency</legend>
                <table width="100%" style={{ borderCollapse: 'collapse' }}><tbody>
                  {selfRatingCriteria.map(item => {
                    const showHeader = item.competency !== lastCompetency;
                    lastCompetency = item.competency;
                    return (
                      <React.Fragment key={item.key}>
                        {showHeader && (
                          <tr>
                            <td colSpan="3" style={{ background: '#f0f0f0', padding: '0.5rem 1rem', fontWeight: 'bold', color: '#333' }}>
                              {item.competency} Competency
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '1rem' }}>
                            <p style={{ fontWeight: 'bold', margin: 0, color: '#333' }}>{item.criteria}</p>
                            <p style={{ fontSize: '0.9rem', margin: '4px 0 0 0', color: '#666' }}>{item.description}</p>
                          </td>
                          <td style={{ padding: '1rem', width: '400px' }}>
                            <RatingSelector
                              value={selfRating[item.key]}
                              onRate={(r) => setSelfRating(prev => ({ ...prev, [item.key]: r }))}
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody></table>
              </fieldset>
            </>
          )}

        </form>
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={() => setStep(step - 1)} disabled={step === 1} className={styles.authButton} style={{ width: 'auto', background: step === 1 ? '#ccc' : '#6c757d', cursor: step === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <button type="submit" form="main-form" disabled={loading} className={styles.authButton} style={{ width: 'auto' }}>
            {loading ? 'Submitting...' : (step === 4 ? 'Submit Application' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}

const ApprovalSection = () => {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState('');

  const fetchPending = async () => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('schedules')
      .select('*, candidate:candidate_id(full_name)')
      .eq('status', 'Pending Approval')
      .gte('created_at', twelveHoursAgo);

    if (error) {
      console.error("Error fetching pending schedules:", error);
      setMessage(`Error: ${error.message}`);
    } else {
      setPending(data || []);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleApproval = async (id, newStatus) => {
    const { error } = await supabase.from('schedules').update({ status: newStatus }).eq('id', id);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Event ${newStatus === 'Scheduled' ? 'approved' : 'deleted'} successfully!`);
      fetchPending(); // Refresh list
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Event deleted successfully!');
      fetchPending(); // Refresh list
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (pending.length === 0) return null;

  return (
    <div style={{ background: '#fff3e0', borderLeft: '5px solid #ff9800', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e65100' }}>Pending Approvals</h2>
      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {pending.map(p => {
        const isExpired = new Date(p.created_at) < new Date(Date.now() - 12 * 60 * 60 * 1000);
        return (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', borderRadius: '8px', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{p.event_name}</p>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>For: {p.candidate?.full_name || 'N/A'} on {p.date}</p>
              {isExpired && <p style={{ color: 'red', margin: '5px 0 0', fontWeight: 'bold' }}>Approval time has expired.</p>}
            </div>
            {!isExpired && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button title="Approve Event" onClick={() => handleApproval(p.id, 'Scheduled')} style={{ background: '#4CAF50', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={20} /></button>
                <button title="Delete Event" onClick={() => handleDelete(p.id)} style={{ background: '#f44336', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const RecentActivity = () => {
  const [schedules, setSchedules] = useState([]);
  useEffect(() => {
    const fetchSchedules = async () => {
      const { data, error } = await supabase.from('schedules').select('id, event_name, date, status, candidate:candidate_id(full_name)').in('status', ['Scheduled', 'Completed']).order('date', { ascending: false }).limit(5);
      if (error) { console.error("Error fetching recent activity:", error); }
      else { setSchedules(data); }
    };
    fetchSchedules();
  }, []);

  return (
    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>Recent Activity</h2>
      {schedules.length > 0 ? (schedules.map(s => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{s.event_name}</p>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{s.candidate?.full_name || 'N/A'} on {s.date}</p>
          </div>
          <span style={{ padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', color: s.status === 'Completed' ? '#1b5e20' : '#0d47a1', background: s.status === 'Completed' ? '#c8e6c9' : '#bbdefb' }}>{s.status}</span>
        </div>
      ))) : <p style={{ color: '#666' }}>No recent scheduled or completed events.</p>}
    </div>
  );
};

function AdminDashboard({ userProfile }) {
  const navigate = useNavigate();
  const [showIntervieweeForm, setShowIntervieweeForm] = useState(false);
  // NEW STATE: For profile creation success popup (Point 3)
  const [successMessage, setSuccessMessage] = useState(''); 
  const [stats, setStats] = useState({ totalCandidates: 0, scheduledToday: 0, upcomingEvaluations: 0, completedThisMonth: 0 });

  const fetchStats = async () => {
    try {
      const { count: candidateCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'candidate');
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Scheduled');
      const { count: upcomingCount } = await supabase.from('schedules').select('*', { count: 'exact', head: true }).gte('date', today).eq('status', 'Scheduled');
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const { count: completedCount } = await supabase.from('schedules').select('*', { count: 'exact', head: true }).gte('date', firstDayOfMonth).eq('status', 'Completed');

      setStats({
        totalCandidates: candidateCount || 0,
        scheduledToday: todayCount || 0,
        upcomingEvaluations: upcomingCount || 0,
        completedThisMonth: completedCount || 0
      });
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  useEffect(() => { fetchStats(); }, []);

  // Updated onSuccess handler for IntervieweeForm (Point 3)
  const handleFormSuccess = (candidate) => {
    fetchStats();
    setSuccessMessage(candidate.message);
    setShowIntervieweeForm(false);
    // Navigate to schedule page as before, but with a slight delay
    setTimeout(() => {
        navigate('/schedule', { state: { candidateId: candidate.uid } });
        setSuccessMessage(''); // Clear message after navigation
    }, 1500);
  };
    
  return (
    <>
      <main className="dashboard-main">
        <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <h1>Welcome back, {userProfile?.full_name?.split(' ')[0]}! 👋</h1>
          <p>Here's your recruitment dashboard overview</p>
        </header>

        {/* Success Popup (Point 3) */}
        {successMessage && (
            <div style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #4caf50',
                fontWeight: 'bold',
                textAlign: 'center'
            }}>
                {successMessage}
            </div>
        )}
        
        {userProfile?.role === 'admin' && <ApprovalSection />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <StatCard icon={Users} title="Total Candidates" value={stats.totalCandidates} subtitle="In recruitment pipeline" />
          <StatCard icon={CalendarIcon} title="Scheduled Today" value={stats.scheduledToday} subtitle="Interviews happening today" color="#e3f2fd" />
          <StatCard icon={Clock} title="Upcoming" value={stats.upcomingEvaluations} subtitle="Evaluations scheduled" color="#fff3e0" />
          <StatCard icon={TrendingUp} title="Completed" value={stats.completedThisMonth} subtitle="This month" color="#e8f5e9" />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <QuickActionCard icon={UserPlus} title="Add New Interviewee" description="Register candidate information" onClick={() => setShowIntervieweeForm(true)} variant="primary" />
            <QuickActionCard icon={CalendarIcon} title="Schedule Interview" description="Create evaluation sessions" onClick={() => navigate('/schedule')} />
            <QuickActionCard icon={TrendingUp} title="View Analytics" description="Review evaluation results" onClick={() => navigate('/analytics')} />
            
            {/* RESTORED LINK: View My Evaluations */}
            <QuickActionCard 
                icon={FileText} 
                title="View My Evaluations" 
                description="Start assigned evaluations/demos" 
                onClick={() => navigate('/evaluations/list')} 
            />

            <QuickActionCard icon={Users} title="View All Interviewees" description="Browse all candidate profiles" onClick={() => navigate('/interviewees')} />
          </div>
        </div>

        <RecentActivity />
      </main>

      {showIntervieweeForm && <IntervieweeForm onClose={() => setShowIntervieweeForm(false)} onSuccess={handleFormSuccess} />}
    </>
  );
}

export default AdminDashboard;