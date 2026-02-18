import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { TEST_ACCOUNTS, TESTING_INSTRUCTIONS } from '../config/testAccounts';
import './TestLogin.css';

const TestLogin = ({ onClose }) => {
  const navigate = useNavigate();
  const { login, testLogin, superAdminLogin } = useSimpleAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickLogin = async (type, index = 0) => {
    try {
      setError('');
      setLoading(true);

      // Add safety checks
      if (!testLogin || !superAdminLogin) {
        throw new Error('Authentication functions not available');
      }

      if (type === 'student') {
        const student = TEST_ACCOUNTS.STUDENTS[index];
        if (!student) {
          throw new Error('Student account not found');
        }
        await testLogin(student.email, student.password, 'student');
      } else if (type === 'admin') {
        const admin = TEST_ACCOUNTS.ADMINS[index];
        if (!admin) {
          throw new Error('Admin account not found');
        }
        await testLogin(admin.email, admin.password, 'admin');
      } else if (type === 'super_admin') {
        if (!TEST_ACCOUNTS.SUPER_ADMIN?.secretCode) {
          throw new Error('Super admin configuration not found');
        }
        await superAdminLogin(TEST_ACCOUNTS.SUPER_ADMIN.secretCode);
      } else {
        throw new Error('Invalid login type');
      }

      // Set flag for post-login redirect
      sessionStorage.setItem('post_login_redirect', 'true');
      
      // Add small delay to ensure state is updated
      setTimeout(() => {
        navigate('/', { replace: true });
        if (onClose) onClose();
      }, 100);

    } catch (error) {
      console.error('Quick login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-login-overlay">
      <div className="test-login-modal">
        <div className="test-login-header">
          <h2>🧪 Test Login Panel</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="test-login-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Student Test Accounts */}
          <div className="test-account-section">
            <h3>👤 Student Accounts</h3>
            <div className="test-accounts-grid">
              {TEST_ACCOUNTS.STUDENTS.map((student, index) => (
                <div key={index} className="test-account-card">
                  <div className="account-info">
                    <strong>{student.displayName}</strong>
                    <div className="account-details">
                      <span>{student.email}</span>
                      <span>Roll: {student.profile.rollNumber}</span>
                      <span>{student.profile.class} - {student.profile.section}</span>
                    </div>
                  </div>
                  <button
                    className="quick-login-btn student-btn"
                    onClick={() => handleQuickLogin('student', index)}
                    disabled={loading}
                  >
                    {loading ? '...' : 'Login'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Test Accounts */}
          <div className="test-account-section">
            <h3>👨‍💼 Admin Accounts</h3>
            <div className="test-accounts-grid">
              {TEST_ACCOUNTS.ADMINS.map((admin, index) => (
                <div key={index} className="test-account-card">
                  <div className="account-info">
                    <strong>{admin.displayName}</strong>
                    <div className="account-details">
                      <span>{admin.email}</span>
                      <span>Dept: {admin.profile.department}</span>
                      <span>ID: {admin.profile.employeeId}</span>
                    </div>
                  </div>
                  <button
                    className="quick-login-btn admin-btn"
                    onClick={() => handleQuickLogin('admin', index)}
                    disabled={loading}
                  >
                    {loading ? '...' : 'Login'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Super Admin Test Account */}
          <div className="test-account-section">
            <h3>🔐 Super Admin Access</h3>
            <div className="test-account-card super-admin-card">
              <div className="account-info">
                <strong>{TEST_ACCOUNTS.SUPER_ADMIN.displayName}</strong>
                <div className="account-details">
                  <span>Secret Code: {TEST_ACCOUNTS.SUPER_ADMIN.secretCode}</span>
                  <span>Full system access</span>
                </div>
              </div>
              <button
                className="quick-login-btn super-admin-btn"
                onClick={() => handleQuickLogin('super_admin')}
                disabled={loading}
              >
                {loading ? '...' : 'Login'}
              </button>
            </div>
          </div>

          {/* Manual Login Instructions */}
          <div className="manual-instructions">
            <h4>📝 Manual Login Instructions</h4>
            <div className="instructions-tabs">
              <div className="instruction-item">
                <strong>Student Login:</strong>
                <ul>
                  <li>Email: {TEST_ACCOUNTS.STUDENTS[0].email}</li>
                  <li>Password: {TEST_ACCOUNTS.STUDENTS[0].password}</li>
                  <li>Select "Student" role on login page</li>
                </ul>
              </div>
              <div className="instruction-item">
                <strong>Admin Login:</strong>
                <ul>
                  <li>Email: {TEST_ACCOUNTS.ADMINS[0].email}</li>
                  <li>Password: {TEST_ACCOUNTS.ADMINS[0].password}</li>
                  <li>Select "Admin" role on login page</li>
                </ul>
              </div>
              <div className="instruction-item">
                <strong>Super Admin Login:</strong>
                <ul>
                  <li>Secret Code: {TEST_ACCOUNTS.SUPER_ADMIN.secretCode}</li>
                  <li>Select "Super Admin" on login page</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="test-login-footer">
          <p className="note">
            ⚠️ These are test accounts for development only. 
            In production, use proper authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;
