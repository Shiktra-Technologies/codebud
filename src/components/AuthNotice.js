import React from 'react';
import './AuthNotice.css';

const AuthNotice = () => {
  return (
    <div className="auth-notice">
      <div className="notice-content">
        <span className="notice-icon">ℹ️</span>
        <div className="notice-text">
          <strong>Simplified Authentication Active</strong>
          <p>
            Using localStorage-based roles due to ad blocker restrictions. 
            Full Firestore integration will be restored once network access is enabled.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthNotice;
