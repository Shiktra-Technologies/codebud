import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import Login from './Login';
import Signup from './Signup';
import Loading from './Loading';

const AuthPage = () => {
  const { currentUser, loading } = useSimpleAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  // Show loading while authentication state is being determined
  if (loading) {
    return <Loading />;
  }

  // If user is already authenticated, redirect to home (which will redirect to appropriate dashboard)
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {isLoginMode ? (
        <Login onToggle={toggleMode} />
      ) : (
        <Signup onToggle={toggleMode} />
      )}
    </div>
  );
};

export default AuthPage;
