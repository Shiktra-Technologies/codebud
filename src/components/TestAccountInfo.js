import React, { useState } from 'react';
import { TEST_ACCOUNTS } from '../config/testAccounts';

const TestAccountInfo = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10001,
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Test Account Info"
      >
        🧪
      </button>

      {/* Info panel */}
      {isVisible && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'white',
          border: '2px solid #ddd',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 10000,
          width: '350px',
          fontSize: '14px',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: '0', color: '#333' }}>🧪 Test Account Info</h3>
            <button 
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Quick Access Reminder */}
          <div style={{
            background: '#e3f2fd',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            border: '1px solid #2196f3'
          }}>
            <strong>💡 Quick Access:</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
              Go to the login page and click <strong>"🧪 Quick Test Login"</strong> for instant login!
            </p>
          </div>

          {/* Student Accounts */}
          <div style={{ marginBottom: '15px' }}>
            <strong>👤 Student Accounts:</strong>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {TEST_ACCOUNTS.STUDENTS.map((student, index) => (
                <div key={index} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <div><strong>{student.displayName}</strong></div>
                  <div>{student.email} / {student.password}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Accounts */}
          <div style={{ marginBottom: '15px' }}>
            <strong>👨‍💼 Admin Accounts:</strong>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {TEST_ACCOUNTS.ADMINS.map((admin, index) => (
                <div key={index} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <div><strong>{admin.displayName}</strong></div>
                  <div>{admin.email} / {admin.password}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Super Admin */}
          <div style={{ marginBottom: '15px' }}>
            <strong>🔐 Super Admin:</strong>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              <div>Secret Code: <strong>{TEST_ACCOUNTS.SUPER_ADMIN.secretCode}</strong></div>
            </div>
          </div>

          <div style={{
            background: '#fff3cd',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ffeaa7',
            fontSize: '12px',
            color: '#856404'
          }}>
            <strong>⚠️ Development Only</strong><br />
            Remove test accounts before production deployment.
          </div>
        </div>
      )}
    </>
  );
};

export default TestAccountInfo;
