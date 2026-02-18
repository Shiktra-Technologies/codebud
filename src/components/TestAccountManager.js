import React, { useState, useEffect } from 'react';
import { TEST_ACCOUNTS } from '../config/testAccounts';

// Lazy load utilities to prevent import errors
let testAccountUtils = null;

const TestAccountManager = () => {
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [utilsLoaded, setUtilsLoaded] = useState(false);

  useEffect(() => {
    // Lazy load the utilities to prevent errors if Supabase is not configured
    const loadUtils = async () => {
      try {
        const utils = await import('../utils/testAccountUtils');
        testAccountUtils = utils;
        setUtilsLoaded(true);
        checkExistingAccounts();
      } catch (err) {
        console.warn('Test account utilities not available:', err);
        setError('Database utilities not available. Using local test accounts only.');
      }
    };
    
    loadUtils();
  }, []);

  const checkExistingAccounts = async () => {
    if (!utilsLoaded || !testAccountUtils) {
      return;
    }
    
    try {
      const result = await testAccountUtils.checkTestAccountsExist();
      if (result.exists) {
        setExistingAccounts(result.accounts);
      }
    } catch (err) {
      console.error('Error checking accounts:', err);
      setError('Unable to check existing accounts');
    }
  };

  const handleCreateAccounts = async () => {
    if (!utilsLoaded || !testAccountUtils) {
      setError('Database utilities not available');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await testAccountUtils.setupTestEnvironment();
      if (result.success) {
        setMessage(result.message);
        checkExistingAccounts(); // Refresh the list
      } else {
        setError(result.message || 'Failed to create accounts');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccounts = async () => {
    if (!utilsLoaded || !testAccountUtils) {
      setError('Database utilities not available');
      return;
    }

    if (!window.confirm('Are you sure you want to delete all test accounts?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await testAccountUtils.deleteTestAccounts();
      if (result.success) {
        setMessage('Test accounts deleted successfully');
        setExistingAccounts([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete accounts');
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10000,
      width: '350px',
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
        🧪 Test Account Manager
      </h3>

      {message && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <strong>Configuration Summary:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '13px' }}>
          <li>{TEST_ACCOUNTS.STUDENTS.length} Student accounts</li>
          <li>{TEST_ACCOUNTS.ADMINS.length} Admin accounts</li>
          <li>1 Super Admin (secret code)</li>
        </ul>
      </div>

      {existingAccounts.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Existing Accounts ({existingAccounts.length}):</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px', maxHeight: '100px', overflow: 'auto' }}>
            {existingAccounts.map((account, index) => (
              <li key={index}>
                {account.display_name} ({account.email}) - {account.role}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleCreateAccounts}
          disabled={loading}
          style={{
            flex: 1,
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px'
          }}
        >
          {loading ? 'Creating...' : 'Create Accounts'}
        </button>

        <button
          onClick={handleDeleteAccounts}
          disabled={loading || existingAccounts.length === 0}
          style={{
            flex: 1,
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: loading || existingAccounts.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px'
          }}
        >
          {loading ? 'Deleting...' : 'Delete All'}
        </button>
      </div>

      <p style={{
        margin: '15px 0 0 0',
        fontSize: '11px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        This panel only appears in development mode
      </p>
    </div>
  );
};

export default TestAccountManager;
