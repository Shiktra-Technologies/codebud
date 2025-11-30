import React, { useState } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Profile.css';

const Profile = () => {
  const { currentUser, userRole, promoteToAdmin } = useSimpleAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      // Profile updates are temporarily disabled in simplified auth
      setMessage('Profile update feature will be available when full authentication is restored.');
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      // Password reset temporarily disabled in simplified auth
      setMessage('Password reset will be available when full authentication is restored.');
    } catch (error) {
      setError('Failed to send password reset email: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>User Profile</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <div className="profile-info">
          <p><strong>Email:</strong> {currentUser?.email}</p>
          <p><strong>Account Created:</strong> {new Date(currentUser?.metadata.creationTime).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name:</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
          
          <button type="submit" disabled={loading} className="update-button">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <div className="profile-actions">
          <button 
            onClick={handlePasswordReset} 
            disabled={loading}
            className="reset-button"
          >
            Reset Password
          </button>
          
          {userRole === 'student' && (
            <button 
              onClick={() => {
                const success = promoteToAdmin();
                if (success) {
                  setMessage('✅ Temporarily promoted to admin! You can now access admin features.');
                  // Force page refresh to update UI
                  setTimeout(() => window.location.reload(), 1000);
                } else {
                  setError('Failed to promote to admin');
                }
              }} 
              disabled={loading}
              className="reset-button"
              style={{ backgroundColor: '#28a745', marginTop: '10px' }}
            >
              🔧 Promote to Admin (Testing)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
