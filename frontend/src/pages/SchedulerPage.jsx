// frontend/src/pages/SchedulerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../assets/Dashboard.css';
import styles from './Auth.module.css';
import { Calendar, Clock, MapPin, Video, Building, CheckCircle } from 'lucide-react';

const eventTypes = [
  { value: 'Classroom Round', label: 'Classroom Round', icon: '📚' },
  { value: 'HR Round', label: 'HR Round', icon: '🤝' },
  { value: 'Technical Round', label: 'Technical Round', icon: '💻' },
  { value: 'Final Round', label: 'Final Round', icon: '🎯' }
];

function SchedulerPage({ userProfile }) {
  const location = useLocation();
  const preSelectedCandidateId = location.state?.candidateId;

  const [formData, setFormData] = useState({
    event_name: '',
    notes: '',
    date: '',
    start_time: '',
    end_time: '',
    round_type: '',
    mode: 'Online',
    location: '',
    candidate_id: preSelectedCandidateId || '',
    evaluator_uids: [],
  });

  const [candidates, setCandidates] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: candidateData, error: candidateError } = await supabase
        .from('users')
        .select('uid, full_name, subject_teaching, resume_url')
        .eq('role', 'candidate');

      if (candidateError) throw candidateError;
      setCandidates(candidateData || []);

      // Fetch all users who are not candidates to be evaluators
      const { data: evaluatorData, error: evaluatorError } = await supabase
        .from('users')
        .select('uid, full_name, role, profile_image_url')
        .in('role', ['student', 'professor', 'admin', 'principal'])
        .eq('profile_complete', true);

      if (evaluatorError) throw evaluatorError;
      setEvaluators(evaluatorData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (preSelectedCandidateId) {
      setFormData(prev => ({ ...prev, candidate_id: preSelectedCandidateId }));
    }
  }, [preSelectedCandidateId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'round_type' && value && formData.candidate_id) {
      const candidate = candidates.find(c => c.uid === formData.candidate_id);
      if (candidate) {
        setFormData(prev => ({
          ...prev,
          event_name: `${candidate.full_name} - ${value}`
        }));
      }
    }
  };

  const handleCandidateSelect = (candidateId) => {
    const candidate = candidates.find(c => c.uid === candidateId);
    setFormData(prev => ({
        ...prev,
        candidate_id: candidateId,
        event_name: prev.round_type ? `${candidate.full_name} - ${prev.round_type}` : '',
    }));
  };

  const toggleEvaluator = (evaluatorUid) => {
    setFormData(prev => {
        const newEvaluatorUids = prev.evaluator_uids.includes(evaluatorUid)
            ? prev.evaluator_uids.filter(uid => uid !== evaluatorUid)
            : [...prev.evaluator_uids, evaluatorUid];
        return { ...prev, evaluator_uids: newEvaluatorUids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.candidate_id || !formData.round_type || !formData.date || !formData.start_time || !formData.end_time || formData.evaluator_uids.length === 0) {
      return setError('Please fill all required fields and select at least one evaluator.');
    }

    const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
    const endDateTime = new Date(`${formData.date}T${formData.end_time}`);
    const durationMinutes = Math.round((endDateTime - startDateTime) / 60000);

    if (durationMinutes <= 0) return setError('End time must be after start time.');

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('schedules').insert({
        ...formData,
        duration_minutes: durationMinutes,
        created_by_uid: userProfile.uid,
        status: 'Pending Approval',
      });

      if (insertError) throw insertError;

      setSuccess('✓ Event scheduled successfully and is pending admin approval.');
      setFormData({
        event_name: '', notes: '', date: '', start_time: '', end_time: '', round_type: '', mode: 'Online', location: '', candidate_id: '', evaluator_uids: [],
      });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(`Error scheduling: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC (No changes needed below this line) ---

  if (loading && candidates.length === 0) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div className="dashboard-main">Loading scheduler...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <main className="dashboard-main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Interview Scheduler</h1>
            <p style={{ color: '#666' }}>Create and assign evaluation sessions for candidates</p>
          </header>

          <form onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #4caf50', fontWeight: 'bold' }}>{success}</div>}

            <section style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ff3b5f', marginBottom: '1rem' }}>1. Select Candidate</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {candidates.map(candidate => (
                  <div key={candidate.uid} onClick={() => handleCandidateSelect(candidate.uid)} style={{ padding: '1rem', border: formData.candidate_id === candidate.uid ? '2px solid #ff3b5f' : '1px solid #e0e0e0', borderRadius: '8px', background: formData.candidate_id === candidate.uid ? '#ffeef2' : '#fff', cursor: 'pointer' }}>
                    <h4>{candidate.full_name}</h4>
                    {candidate.resume_url && <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ color: '#ff3b5f' }}>View Resume →</a>}
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ff3b5f', marginBottom: '1rem' }}>2. Event Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Event Name</label>
                  <input type="text" name="event_name" value={formData.event_name} onChange={handleChange} className={styles.authInput} placeholder="Auto-generated or custom" />
                </div>
                <div>
                  <label>Round Type *</label>
                  <select name="round_type" value={formData.round_type} onChange={handleChange} className={styles.authInput} required>
                    <option value="">Select Round</option>
                    {eventTypes.map(type => (<option key={type.value} value={type.value}>{type.icon} {type.label}</option>))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label>Notes / Description</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className={styles.authInput} rows="3" placeholder="Additional instructions..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label><Calendar size={16} /> Date *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className={styles.authInput} required />
                </div>
                <div>
                  <label><Clock size={16} /> Start Time *</label>
                  <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className={styles.authInput} required />
                </div>
                <div>
                  <label><Clock size={16} /> End Time *</label>
                  <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className={styles.authInput} required />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label><MapPin size={16} /> Event Mode</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, mode: 'Online' }))} style={{ flex: 1, border: formData.mode === 'Online' ? '2px solid #ff3b5f' : '1px solid #ddd', borderRadius: '8px', padding: '1rem', background: formData.mode === 'Online' ? '#ffeef2' : '#fff' }}><Video size={18} /> Online</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, mode: 'Offline' }))} style={{ flex: 1, border: formData.mode === 'Offline' ? '2px solid #ff3b5f' : '1px solid #ddd', borderRadius: '8px', padding: '1rem', background: formData.mode === 'Offline' ? '#ffeef2' : '#fff' }}><Building size={18} /> Offline</button>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label>Location / Meeting Link</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className={styles.authInput} placeholder={formData.mode === 'Online' ? 'e.g., Zoom link' : 'e.g., Room 301'} />
              </div>
            </section>

            <section style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ff3b5f', marginBottom: '1rem' }}>3. Assign Evaluators *</h3>
              <p>Selected: {formData.evaluator_uids.length} evaluator(s)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {evaluators.map(evaluator => (
                  <div key={evaluator.uid} onClick={() => toggleEvaluator(evaluator.uid)} style={{ padding: '1rem', border: formData.evaluator_uids.includes(evaluator.uid) ? '2px solid #ff3b5f' : '1px solid #e0e0e0', borderRadius: '8px', background: formData.evaluator_uids.includes(evaluator.uid) ? '#ffeef2' : '#fff', cursor: 'pointer', position: 'relative' }}>
                    {formData.evaluator_uids.includes(evaluator.uid) && <CheckCircle size={20} style={{ color: '#ff3b5f', position: 'absolute', top: 8, right: 8 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={evaluator.profile_image_url || 'https://via.placeholder.com/40'} alt={evaluator.full_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <h4 style={{ margin: 0 }}>{evaluator.full_name}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{evaluator.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => window.history.back()} style={{ padding: '0.75rem 2rem', border: '1px solid #ddd', background: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} className={styles.authButton} style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={20} />{loading ? 'Scheduling...' : 'Schedule Interview'}</button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default SchedulerPage;