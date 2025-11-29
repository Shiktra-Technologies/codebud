import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

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
