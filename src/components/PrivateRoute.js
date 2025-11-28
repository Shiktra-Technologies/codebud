import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';

const PrivateRoute = ({ children, requireRole = null, requirePermission = null }) => {
  const { currentUser, userRole } = useSimpleAuth();
  
  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  // Check if user role is loaded
  if (!userRole) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading user permissions...</p>
      </div>
    );
  }

  // Check role requirement
  if (requireRole && userRole !== requireRole) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have the required role to access this page.</p>
          <p><strong>Required role:</strong> {requireRole}</p>
          <p><strong>Your role:</strong> {userRole}</p>
          <button onClick={() => window.history.back()} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Skip permission requirement for simplified auth
  // Can be re-enabled later when Firestore is working
  
  return children;
};

export default PrivateRoute;
