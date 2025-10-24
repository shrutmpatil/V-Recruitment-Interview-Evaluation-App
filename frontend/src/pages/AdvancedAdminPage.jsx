// frontend/src/pages/AdvancedAdminPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import Sidebar from '../components/Sidebar.jsx';
import '../assets/Dashboard.css';
import styles from './Auth.module.css';
import { Check, X, Trash2, Edit, Save, Calendar, Clock } from 'lucide-react';

const ScheduleEditModal = ({ schedule, onSave, onClose }) => {
    const [formData, setFormData] = useState(schedule);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
        const endDateTime = new Date(`${formData.date}T${formData.end_time}`);
        const durationMinutes = Math.round((endDateTime - startDateTime) / 60000);
        
        if (durationMinutes <= 0) {
            setError('End time must be after start time.');
            setLoading(false);
            return;
        }

        try {
            const updatePayload = {
                ...formData,
                duration_minutes: durationMinutes,
            };
            delete updatePayload.candidate; // Remove nested candidate object
            
            const { error: updateError } = await supabase
                .from('schedules')
                .update(updatePayload)
                .eq('id', schedule.id);

            if (updateError) throw updateError;
            
            onSave();
        } catch (err) {
            setError(`Failed to update schedule: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <h2 style={{ color: '#ff3b5f', marginTop: 0 }}>Edit Schedule for {schedule.candidate?.full_name}</h2>
                {error && <p className={styles.error}>{error}</p>}
                
                <form onSubmit={handleSave}>
                    <label>Event Name</label>
                    <input type="text" name="event_name" value={formData.event_name} onChange={handleChange} className={styles.authInput} required />
                    
                    <label>Round Type</label>
                    <input type="text" name="round_type" value={formData.round_type} onChange={handleChange} className={styles.authInput} required />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className={styles.authInput} required /></div>
                        <div><label>Start Time</label><input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className={styles.authInput} required /></div>
                        <div><label>End Time</label><input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className={styles.authInput} required /></div>
                    </div>
                    
                    <label>Location / Mode</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className={styles.authInput} placeholder="Location / Meeting Link" />
                    <input type="text" name="mode" value={formData.mode} onChange={handleChange} className={styles.authInput} placeholder="Online/Offline" />
                    
                    <label>Notes</label>
                    <textarea name="notes" value={formData.notes || ''} onChange={handleChange} className={styles.authInput} rows="2" />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={loading} className={styles.authButton} style={{ width: 'auto', backgroundColor: '#007bff' }}>
                            {loading ? 'Saving...' : <><Save size={18} style={{ marginRight: '5px' }} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function AdvancedAdminPage({ userProfile }) {
    const [schedules, setSchedules] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const fetchSchedules = async () => {
        setLoading(true);
        // Fetch all non-completed schedules to allow for editing/approval
        const { data, error } = await supabase
            .from('schedules')
            .select('*, candidate:candidate_id(full_name, profile_image_url)')
            .not('status', 'eq', 'Completed')
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error("Error fetching schedules:", error);
            setMessage(`Error: ${error.message}`);
        } else {
            setSchedules(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSchedules();
        const interval = setInterval(fetchSchedules, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handleApproval = async (id, newStatus) => {
        const { error } = await supabase.from('schedules').update({ status: newStatus }).eq('id', id);
        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage(`Event ${newStatus === 'Scheduled' ? 'approved' : 'cancelled'} successfully!`);
            fetchSchedules(); // Refresh list
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Event deleted successfully!');
            fetchSchedules(); // Refresh list
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="app-container">
            <Sidebar userProfile={userProfile} />
            <div className="main-content">
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <h1 style={{ fontSize: '2rem' }}>Advanced Schedule Management</h1>
                        <p>Approve, edit, or cancel upcoming and pending interview events.</p>
                    </header>
                    
                    {message && (
                        <div className={styles.error} style={{ 
                            background: message.startsWith('Error') ? '#ffebee' : message.includes('deleted') || message.includes('cancelled') ? '#fff3e0' : '#e8f5e9',
                            color: message.startsWith('Error') ? '#ff3b5f' : message.includes('deleted') || message.includes('cancelled') ? '#ff9800' : '#2e7d32',
                            border: `1px solid ${message.startsWith('Error') ? '#ff3b5f' : message.includes('deleted') || message.includes('cancelled') ? '#ff9800' : '#4caf50'}`,
                            fontWeight: 'bold', 
                            marginBottom: '1rem' 
                        }}>
                            {message}
                        </div>
                    )}

                    {loading ? (
                        <p>Loading active schedules...</p>
                    ) : schedules.length === 0 ? (
                        <div className="placeholder-card">
                            <h3>No active schedules found.</h3>
                            <p>All evaluations may be completed or no events have been scheduled yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            {schedules.map(schedule => {
                                const isPending = schedule.status === 'Pending Approval';
                                return (
                                    <div 
                                        key={schedule.id} 
                                        style={{ 
                                            background: isPending ? '#fffbe6' : '#fff', 
                                            padding: '1.5rem', 
                                            borderRadius: '12px', 
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{schedule.event_name}</p>
                                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Candidate: <strong>{schedule.candidate?.full_name || 'N/A'}</strong> | Round: {schedule.round_type}</p>
                                            <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                                                <Calendar size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> {schedule.date} from {schedule.start_time} to {schedule.end_time}
                                            </p>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '12px', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.8rem',
                                                marginTop: '5px',
                                                display: 'inline-block',
                                                color: isPending ? '#e65100' : '#0d47a1', 
                                                background: isPending ? '#ffe0b2' : '#bbdefb' 
                                            }}>{schedule.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', minWidth: '150px' }}>
                                            {isPending && (
                                                <button title="Approve Event" onClick={() => handleApproval(schedule.id, 'Scheduled')} style={{ background: '#4CAF50', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18} /></button>
                                            )}
                                            {schedule.status !== 'Cancelled' && (
                                                <button title="Cancel Event" onClick={() => handleApproval(schedule.id, 'Cancelled')} style={{ background: '#f44336', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                                            )}
                                            <button title="Edit Event" onClick={() => setSelectedSchedule(schedule)} style={{ background: '#007bff', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={18} /></button>
                                            <button title="Delete Event Permanently" onClick={() => handleDelete(schedule.id)} style={{ background: '#9e9e9e', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
            {selectedSchedule && (
                <ScheduleEditModal
                    schedule={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                    onSave={() => {
                        setSelectedSchedule(null);
                        fetchSchedules();
                        setMessage('Schedule updated successfully!');
                        setTimeout(() => setMessage(''), 3000);
                    }}
                />
            )}
        </div>
    );
}

export default AdvancedAdminPage;