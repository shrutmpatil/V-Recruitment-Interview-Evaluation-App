import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import styles from './Auth.module.css';
import getStartedImg from '../assets/signup_logo.png';

function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      setLoading(false);
      return;
    }

    // Prevent admin/principal signup
    if (role === 'admin' || role === 'principal') {
      setError('Admin and Principal accounts cannot be created via signup. Contact system administrator.');
      setLoading(false);
      return;
    }

    try {
      // Create auth user with metadata
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // Success - trigger reload to update auth state
        navigate(0);
      } else {
        throw new Error("Signup successful, but no user data returned. Please log in.");
      }

    } catch (err) {
      setError(err.message);
      console.error("Error signing up:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <img src={getStartedImg} alt="Get Started" className={styles.authImage} />
        <h2>Get Started</h2>
        <p>by creating a free account.</p>

        {error && <p className={styles.error}>{error}</p>}

        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={styles.authInput}
          required
        />
        <input
          type="email"
          placeholder="Valid email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.authInput}
          required
        />
        <input
          type="tel"
          placeholder="Phone number (Optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={styles.authInput}
        />
        <input
          type="password"
          placeholder="Strong Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.authInput}
          required
        />
        
        {/* Role Selection - Only Student and Professor */}
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          className={styles.authInput}
        >
          <option value="student">Student (Classroom Evaluator)</option>
          <option value="professor">Faculty (All Rounds Evaluator)</option>
        </select>

        <button type="submit" className={styles.authButton} disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <p className={styles.authSwitch}>
          Already a member? <Link to="/login">Log In</Link>
        </p>
        
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
          Admin and Principal accounts are managed by the system. Contact your administrator for access.
        </p>
      </form>
    </div>
  );
}

export default SignupPage;