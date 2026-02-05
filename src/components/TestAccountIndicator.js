import React from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';

const TestAccountIndicator = () => {
  const { currentUser } = useSimpleAuth();

  // Only show if it's a test account (ID starts with 'test_')
  if (!currentUser || !currentUser.id || !currentUser.id.startsWith('test_')) {
    return null;
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <span>🧪</span>
      <span>Test Account: {currentUser.displayName}</span>
    </div>
  );
};

export default TestAccountIndicator;
