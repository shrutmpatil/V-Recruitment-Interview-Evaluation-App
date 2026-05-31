// shrutmpatil/v-rec-1/V-REC-1-ed109d28e5fc1a68accbc2326ba7616965905b05/frontend/src/pages/CompleteProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import styles from './Auth.module.css'; 

// --- FIX: Refactored Role-Specific Components ---

const StudentProfileFields = ({ profileData, handleInputChange, styles, renderAcademicYearOptions }) => (
  <>
    <select name="degree_type" value={profileData.degree_type} onChange={handleInputChange} className={styles.authInput} required>
      <option value="">Select Degree Type*</option>
      <option value="Undergraduate">Undergraduate</option>
      <option value="Postgraduate">Postgraduate</option>
    </select>
    {profileData.degree_type && (
        <select name="academic_year" value={profileData.academic_year} onChange={handleInputChange} className={styles.authInput} required>
            <option value="">Select Academic Year*</option>
            {renderAcademicYearOptions()}
        </select>
    )}
  </>
);

const ProfessorProfileFields = ({ profileData, handleInputChange, styles, experienceOptions }) => (
  <>
    <input type="text" name="subject_teaching" placeholder="Primary Subject(s) of Expertise" value={profileData.subject_teaching} onChange={handleInputChange} className={styles.authInput} required />
    <select name="experience" value={profileData.experience} onChange={handleInputChange} className={styles.authInput} required>
      <option value="">Select Years of Experience*</option>
      {experienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </>
);

const AdminPrincipalFields = ({ styles, profileData, handleInputChange }) => (
    <>
        <p style={{margin: "20px 0", color: '#ff3b5f', fontWeight: 'bold'}}>
            System Account: Your core details are fixed and managed by the system.
        </p>
        <input 
            type="tel" 
            name="phone_number" 
            placeholder="Phone number" 
            value={profileData.phone_number} 
            onChange={handleInputChange} 
            className={styles.authInput} 
        />
        <input 
            type="text" 
            placeholder="Role/Department (Fixed)" 
            value="System Admin/Principal" 
            className={styles.authInput} 
            disabled 
            style={{ opacity: 0.6 }}
        />
    </>
);

// --- CompleteProfilePage Main Component ---

// Dummy images for avatar selection
const dummyImages = [
  'https://placehold.co/100x100/EBFBFF/868686?text=User+1',
  'https://placehold.co/100x100/FFF8EB/868686?text=User+2',
  'https://placehold.co/100x100/EBFFEE/868686?text=User+3',
  'https://placehold.co/100x100/FBEBFF/868686?text=User+4',
];

// Reusable lists for profile fields
const degreeOptions = ['B.Tech', 'B.Com', 'B.Sc', 'M.Tech', 'M.Sc', 'PhD', 'Other'];
const experienceOptions = ['0-2 years', '3-5 years', '5-10 years', '10+ years'];

const initialData = {
    profile_image_url: dummyImages[0], 
    college: '', 
    phone_number: '', 
    degree_type: '', degree: '', academic_year: '', linkedin_url: '',
    experience: '', 
    subject_teaching: '', 
    resume_url: '', 
};


// isEditing: true if accessed via /profile route; false if via /complete-profile route
function CompleteProfilePage({ isEditing = false, userProfile: propUserProfile }) {
  const [userProfile, setUserProfile] = useState(propUserProfile || null); 
  const [profileData, setProfileData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetches initial data or uses passed props
  useEffect(() => {
    const fetchAndInitializeProfile = async () => {
        let profile = propUserProfile;

        if (!profile) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { 
                setLoading(false);
                return;
            }
            const { data: fetchedProfile } = await supabase.from('users').select('*').eq('uid', user.id).single();
            profile = fetchedProfile;
        }

        if (profile) {
            setUserProfile(profile);
            // Populate form data, handling null/undefined fields
            const dataToSet = {
                profile_image_url: profile.profile_image_url || initialData.profile_image_url,
                college: profile.college || initialData.college,
                phone_number: profile.phone_number || initialData.phone_number,
                degree_type: profile.degree_type || initialData.degree_type,
                degree: profile.degree || initialData.degree,
                academic_year: profile.academic_year || initialData.academic_year,
                linkedin_url: profile.linkedin_url || initialData.linkedin_url,
                experience: profile.experience || initialData.experience,
                subject_teaching: profile.subject_teaching || initialData.subject_teaching,
                resume_url: profile.resume_url || initialData.resume_url,
            };
            setProfileData(dataToSet);
        } else {
            // This case occurs if the trigger failed but auth succeeded
            setError('Could not load user profile details. Please try logging out and back in.');
        }
        setLoading(false);
    };

    fetchAndInitializeProfile();
  }, [propUserProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageSelect = (imageUrl) => {
      setProfileData(prev => ({ ...prev, profile_image_url: imageUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!userProfile) throw new Error("User session expired. Please log in.");

      const payload = { ...profileData };
      if (!isEditing) {
          // Only set profile_complete to true on the initial run
          payload.profile_complete = true; 
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update(payload)
        .eq('uid', userProfile.uid);

      if (updateError) throw updateError;
      
      console.log("Profile updated successfully!"); 
      
      if (!isEditing) {
          // On initial completion, navigate to the dashboard and force a refresh
          navigate('/'); 
          navigate(0);
      } else {
          // On editing, redirect to home.
          navigate('/'); 
      }

    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
      console.error(err);
    }
  };

  const renderAcademicYearOptions = () => {
    // Only supports 4 years for undergraduate and 2 for postgraduate (renamed from degree_type value)
    const yearsCount = profileData.degree_type === 'Undergraduate' ? 4 : 2; 
    // Expanded names for clarity
    const yearNames = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'First Year (PG)', 'Second Year (PG)']; 
    
    return Array.from({ length: yearsCount }, (_, i) => {
        const index = profileData.degree_type === 'Undergraduate' ? i : i + 4; // Use index 0-3 for UG, 4-5 for PG
        // Removed 'selected' attribute here to let React handle it via the 'value' prop on the outer <select>
        return <option key={i} value={yearNames[index]}>{yearNames[index]}</option>;
    });
  };


  const renderFormFields = () => {
    if (!userProfile) return null;

    const isAdminOrPrincipal = userProfile.role === 'admin' || userProfile.role === 'principal';

    if (isAdminOrPrincipal) {
        // FIX: Use refactored AdminPrincipalFields component
        return <AdminPrincipalFields styles={styles} profileData={profileData} handleInputChange={handleInputChange} />;
    }

    return (
      <>
        <input 
            type="tel" 
            name="phone_number" 
            placeholder="Phone number" 
            value={profileData.phone_number} 
            onChange={handleInputChange} 
            className={styles.authInput} 
        />
        <input 
            type="text" 
            name="college" 
            placeholder="College/Department" 
            value={profileData.college} 
            onChange={handleInputChange} 
            className={styles.authInput} 
            required 
        />
        
        {/* Render role-specific fields using refactored components */}
        {userProfile.role === 'student' && (
          <StudentProfileFields 
            profileData={profileData} 
            handleInputChange={handleInputChange} 
            styles={styles} 
            renderAcademicYearOptions={renderAcademicYearOptions} 
          />
        )}
        
        <select name="degree" value={profileData.degree} onChange={handleInputChange} className={styles.authInput} required>
            <option value="">Select Highest Degree*</option>
            {/* Removed 'selected' attribute here to let React handle it via the 'value' prop */}
            {degreeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        
        <input type="url" name="linkedin_url" placeholder="LinkedIn Profile URL" value={profileData.linkedin_url} onChange={handleInputChange} className={styles.authInput} />

        {/* Professor Specific Fields */}
        {userProfile.role === 'professor' && (
          <ProfessorProfileFields 
            profileData={profileData} 
            handleInputChange={handleInputChange} 
            styles={styles} 
            experienceOptions={experienceOptions} 
          />
        )}
      </>
    );
  };

  if (loading) return <div className={styles.authContainer}>Loading Profile Data...</div>;


  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2 style={{color: isEditing ? '#333' : '#ff3b5f'}}>
            {isEditing ? 'Edit Your Profile' : 'Complete Your Profile'}
        </h2>
        <p>
            {isEditing ? `Editing profile for ${userProfile?.full_name} (${userProfile?.role}).` : 'Please provide some additional information to proceed.'}
        </p>

        {error && <p className={styles.error}>{error}</p>}
        
        <div className={styles.imageSelector}>
          <p style={{fontWeight: 600}}>Select a Profile Image:</p>
          {dummyImages.map(img => (
            <img 
              key={img} 
              src={img} 
              alt="Profile avatar" 
              className={profileData.profile_image_url === img ? styles.selectedImage : ''}
              onClick={() => handleImageSelect(img)}
            />
          ))}
        </div>

        {renderFormFields()}
        
        <button type="submit" className={styles.authButton}>
            {isEditing ? 'Save Changes' : 'Save & Continue to Dashboard'}
        </button>
      </form>
    </div>
  );
}

export default CompleteProfilePage;