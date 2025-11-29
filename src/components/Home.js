import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import Loading from './Loading';

const Home = () => {
  const { currentUser, userRole, loading } = useSimpleAuth();
  const [showTimeout, setShowTimeout] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timeout);
  }, []);

  // Set ready state when we have both user and role AND auth is not loading
  useEffect(() => {
    if (currentUser && userRole && !loading) {
      console.log('Home: Auth complete, user and role available, setting ready');
      // If this is a fresh page load (not a post-login redirect), redirect immediately
      // If this is post-login, add small delay to ensure smooth transition
      const isPostLogin = sessionStorage.getItem('post_login_redirect');
      const delay = isPostLogin ? 100 : 0;
      
      const readyTimeout = setTimeout(() => {
        setIsReady(true);
        // Clear the post-login flag
        sessionStorage.removeItem('post_login_redirect');
      }, delay);
      
      return () => clearTimeout(readyTimeout);
    }
  }, [currentUser, userRole, loading]);
  
  console.log('Home: currentUser:', currentUser ? 'logged in' : 'not logged in');
  console.log('Home: userRole:', userRole);
  console.log('Home: loading:', loading);
  console.log('Home: isReady:', isReady);
  
  // If not authenticated, redirect to auth page
  if (!currentUser) {
    console.log('Home: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  
  // If authenticated but not ready yet, show loading or timeout message
  if (!isReady) {
    console.log('Home: Not ready yet, showing loading');
    if (showTimeout) {
      return (
        <div className="dashboard-container">
          <div className="error-container">
            <h2>Loading User Profile</h2>
            <p>Taking longer than expected...</p>
            <p>User: {currentUser ? 'Logged in' : 'Not logged in'}</p>
            <p>Role: {userRole || 'Loading...'}</p>
            <p>Auth Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Ready: {isReady ? 'Yes' : 'No'}</p>
            <button onClick={() => window.location.reload()}>Refresh Page</button>
            <br />
            <a href="/auth">Go to Login</a>
          </div>
        </div>
      );
    }
    return <Loading />;
  }
  
  // If authenticated and ready, redirect directly to appropriate dashboard
  console.log('Home: Ready - redirecting to role-specific dashboard');
  
  // Determine the appropriate route based on role
  let targetRoute = '/student'; // Default to student
  if (userRole === 'admin') {
    targetRoute = '/admin';
  } else if (userRole === 'super_admin') {
    targetRoute = '/super-admin';
  }
  
  console.log(`Home: Redirecting to ${targetRoute} for role: ${userRole}`);
  return <Navigate to={targetRoute} replace />;
};

export default Home;
