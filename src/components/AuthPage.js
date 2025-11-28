import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import AuthNotice from './AuthNotice';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <AuthNotice />
      {isLoginMode ? (
        <Login onToggle={toggleMode} />
      ) : (
        <Signup onToggle={toggleMode} />
      )}
    </div>
  );
};

export default AuthPage;
