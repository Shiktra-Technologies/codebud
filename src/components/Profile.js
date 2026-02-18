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
          <p><strong>Role:</strong> {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'Not Set'}</p>
          <p><strong>Account Created:</strong> {
            currentUser?.metadata?.creationTime 
              ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
              : currentUser?.id?.startsWith('test_')
                ? 'Test Account (Development)'
                : 'Not Available'
          }</p>
          {currentUser?.id?.startsWith('test_') && (
            <div style={{ 
              background: '#e8f5e8', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #4CAF50',
              marginTop: '10px'
            }}>
              <p style={{ color: '#2e7d32', fontWeight: '500', margin: '0 0 8px 0' }}>
                🧪 Test Account Information
              </p>
              {currentUser.profile && (
                <div style={{ fontSize: '14px', color: '#555' }}>
                  {currentUser.profile.rollNumber && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Roll Number:</strong> {currentUser.profile.rollNumber}
                    </p>
                  )}
                  {currentUser.profile.class && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Class:</strong> {currentUser.profile.class}
                    </p>
                  )}
                  {currentUser.profile.section && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Section:</strong> {currentUser.profile.section}
                    </p>
                  )}
                  {currentUser.profile.department && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Department:</strong> {currentUser.profile.department}
                    </p>
                  )}
                  {currentUser.profile.employeeId && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Employee ID:</strong> {currentUser.profile.employeeId}
                    </p>
                  )}
                </div>
              )}
              <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                This is a development test account with mock data
              </p>
            </div>
          )}
        </div>

        {/* Test Account Controls - Development Only */}
        {currentUser?.id?.startsWith('test_') && process.env.NODE_ENV === 'development' && (
          <div style={{
            background: '#fff3cd',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
            margin: '20px 0'
          }}>
            <h3 style={{ color: '#856404', margin: '0 0 10px 0', fontSize: '16px' }}>
              🧪 Test Account Controls
            </h3>
            <p style={{ fontSize: '14px', color: '#856404', margin: '0 0 15px 0' }}>
              These controls are only available for test accounts in development mode.
            </p>
            
            {userRole === 'student' && (
              <button
                onClick={() => {
                  if (promoteToAdmin()) {
                    setMessage('Successfully promoted to admin for testing!');
                    window.location.reload();
                  }
                }}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginRight: '10px'
                }}
              >
                🔧 Promote to Admin (Test)
              </button>
            )}
            
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/auth';
              }}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🚪 Logout & Clear Data
            </button>
          </div>
        )}

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
