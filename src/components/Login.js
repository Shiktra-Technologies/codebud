import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Login.css';

const Login = ({ onToggle }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'user', 'admin', 'super_admin'
  const [showSecretField, setShowSecretField] = useState(false);
  const { login, superAdminLogin, USER_ROLES } = useSimpleAuth();

  const redirectToDashboard = (role) => {
    // Use the Home component routing by going to root
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      
      if (loginType === 'super_admin') {
        if (!secretCode) {
          setError('Secret code is required for super admin access');
          setLoading(false);
          return;
        }
        await superAdminLogin(secretCode);
        // Set flag to indicate this is a post-login redirect
        sessionStorage.setItem('post_login_redirect', 'true');
        // Navigate immediately - Home component will handle the state checking
        navigate('/', { replace: true });
      } else {
        // Pass the selected role to login function
        const selectedRole = loginType === 'admin' ? USER_ROLES.ADMIN : USER_ROLES.STUDENT;
        await login(email, password, selectedRole);
        
        // Set flag to indicate this is a post-login redirect
        sessionStorage.setItem('post_login_redirect', 'true');
        // Navigate immediately - Home component will handle the state checking
        navigate('/', { replace: true });
      }
    } catch (error) {
      let errorMessage = 'Failed to sign in: ';
      if (error.message.includes('Invalid super admin secret code')) {
        errorMessage = 'Invalid super admin secret code. Please check and try again.';
      } else if (error.message.includes('Access denied')) {
        errorMessage = error.message; // Use the full role validation error message
      } else if (error.message.includes('invalid-credential')) {
        errorMessage = 'Invalid email or password.';
      } else if (error.message.includes('user-not-found')) {
        errorMessage = 'No account found with this email.';
      } else if (error.message.includes('wrong-password')) {
        errorMessage = 'Incorrect password.';
      } else {
        errorMessage += error.message;
      }
      setError(errorMessage);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('Google sign-in temporarily disabled. Please use email/password.');
  };

  // Secret key combination to reveal super admin option
  const handleKeyPress = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      setShowSecretField(true);
      setLoginType('super_admin');
      e.preventDefault();
    }
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setError('');
    setSecretCode('');
    
    if (type !== 'super_admin') {
      setShowSecretField(false);
    }
  };

  return (
    <div className="auth-container" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Simplified Login Type Selection */}
        <div className="login-type-selection">
          <div className="role-selector">
            <button
              type="button"
              className={`role-button ${loginType === 'user' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('user')}
            >
              <div className="role-icon">👤</div>
              <div className="role-label">Student</div>
            </button>
            <button
              type="button"
              className={`role-button ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('admin')}
            >
              <div className="role-icon">👨‍💼</div>
              <div className="role-label">Admin</div>
            </button>
            {showSecretField && (
              <button
                type="button"
                className={`role-button ${loginType === 'super_admin' ? 'active' : ''}`}
                onClick={() => handleLoginTypeChange('super_admin')}
              >
                <div className="role-icon">🔐</div>
                <div className="role-label">Super Admin</div>
              </button>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {loginType !== 'super_admin' ? (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Super Admin Secret Code</label>
              <input
                type="password"
                placeholder="Enter secret code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                className="secret-input"
              />
            </div>
          )}
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              `Sign In ${loginType === 'user' ? '' : `as ${loginType === 'admin' ? 'Admin' : 'Super Admin'}`}`
            )}
          </button>
        </form>

        {loginType !== 'super_admin' && (
          <>
            <div className="divider">
              <span>or</span>
            </div>

            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="google-button"
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        <div className="auth-footer">
          <p className="auth-switch">
            Don't have an account?{' '}
            <button onClick={onToggle} className="link-button">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
