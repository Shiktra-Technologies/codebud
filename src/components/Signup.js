import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Login.css'; // Reusing the same styles

const Signup = ({ onToggle }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, USER_ROLES } = useSimpleAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      
      const userRole = role === 'admin' ? USER_ROLES.ADMIN : USER_ROLES.STUDENT;
      await signup(email, password, userRole);
      
      // Navigate directly to the appropriate dashboard based on selected role
      const dashboardPath = userRole === USER_ROLES.ADMIN ? '/admin' : '/student';
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      setError('Failed to create account: ' + error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('Google sign-in temporarily disabled. Please use email/password.');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        
        {/* Role Selection */}
        <div className="role-selection">
          <h3>Select Account Type</h3>
          <div className="role-options">
            <label className={`role-option ${role === 'student' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={(e) => setRole(e.target.value)}
              />
              <div className="role-content">
                <span className="role-icon">🎓</span>
                <div className="role-info">
                  <strong>Student</strong>
                  <p>Take tests and view your results</p>
                </div>
              </div>
            </label>
            
            <label className={`role-option ${role === 'admin' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={(e) => setRole(e.target.value)}
              />
              <div className="role-content">
                <span className="role-icon">👨‍💼</span>
                <div className="role-info">
                  <strong>Admin</strong>
                  <p>Manage students and monitor tests</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Display Name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : `Create ${role === 'admin' ? 'Admin' : 'Student'} Account`}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="google-button"
        >
          Sign up with Google as {role === 'admin' ? 'Admin' : 'Student'}
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={onToggle} className="link-button">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
