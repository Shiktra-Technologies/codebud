import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import Loading from './Loading';

const Home = () => {
  const { currentUser, userRole } = useSimpleAuth();
  const [showTimeout, setShowTimeout] = useState(false);
  
  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timeout);
  }, []);
  
  console.log('Home: currentUser:', currentUser ? 'logged in' : 'not logged in');
  console.log('Home: userRole:', userRole);
  
  // If not authenticated, redirect to auth page
  if (!currentUser) {
    console.log('Home: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  
  // If authenticated but no role yet, show loading or timeout message
  if (!userRole) {
    console.log('Home: User but no role, showing loading');
    if (showTimeout) {
      return (
        <div className="dashboard-container">
          <div className="error-container">
            <h2>Loading User Profile</h2>
            <p>Taking longer than expected...</p>
            <button onClick={() => window.location.reload()}>Refresh Page</button>
            <br />
            <a href="/auth">Go to Login</a>
          </div>
        </div>
      );
    }
    return <Loading />;
  }
  
  // If authenticated with role, redirect to appropriate dashboard
  console.log('Home: User with role, redirecting to dashboard');
  switch (userRole) {
    case 'student':
      return <Navigate to="/student" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;
    default:
      console.error('Unknown user role:', userRole);
      return <Navigate to="/auth" replace />;
  }
};

export default Home;
