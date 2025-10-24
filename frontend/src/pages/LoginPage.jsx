import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Corrected path: Go up one level from 'pages' to the 'src' directory
import { supabase } from '../supabase.js';
// Corrected path: Look in the current 'pages' directory
import styles from './Auth.module.css';
// Corrected path: Go up one level to 'src', then down into 'assets'
import logo from '../assets/App_logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      // Navigate to home and refresh to trigger the auth state check in App.jsx
      navigate('/');
      navigate(0); 
    } catch (err) {
      setError(err.message);
      console.error("Error logging in with Supabase:", err);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <img src={logo} alt="Vidyalankar Logo" className={`${styles.authImage} ${styles.logo}`} />
        <h2>Sign In</h2>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.authInput}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.authInput}
          required
        />

        <button type="submit" className={styles.authButton}>Next</button>

        <p className={styles.authSwitch}>
          New Member? <Link to="/signup">Register now</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;

