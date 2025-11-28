import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import AdminDashboard from './AdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, isStudent, isAdmin, isSuperAdmin } = useSimpleAuth();

  // Redirect to appropriate dashboard based on user role
  React.useEffect(() => {
    if (userRole) {
      if (isSuperAdmin()) {
        navigate('/super-admin', { replace: true });
      } else if (isAdmin()) {
        navigate('/admin', { replace: true });
      } else if (isStudent()) {
        navigate('/student', { replace: true });
      }
    }
  }, [userRole, navigate, isStudent, isAdmin, isSuperAdmin]);

  // Show loading while determining role
  if (!userRole) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback content (shouldn't normally be reached due to redirect)
  return (
    <div className="dashboard-container">
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;
