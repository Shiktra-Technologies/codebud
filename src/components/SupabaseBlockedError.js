import React, { useState } from 'react';
import './ErrorBoundary.css';

const SupabaseBlockedError = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="error-boundary">
      <div className="error-content">
        <h1>🔒 Supabase Access Blocked</h1>
        <p>
          Your browser or an extension is blocking Supabase connections.
          This is preventing the authentication system from working properly.
        </p>
        
        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? 'Hide' : 'Show'} Fix Instructions
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>

        {showInstructions && (
          <div className="instructions">
            <h3>How to Fix This:</h3>
            <ol>
              <li>
                <strong>Disable Ad Blockers:</strong>
                <ul>
                  <li>Look for ad blocker icons in your browser toolbar</li>
                  <li>Click on uBlock Origin, AdBlock Plus, or similar extensions</li>
                  <li>Whitelist this website (localhost:3000)</li>
                </ul>
              </li>
              <li>
                <strong>Check Browser Extensions:</strong>
                <ul>
                  <li>Disable privacy/security extensions temporarily</li>
                  <li>Try opening in an incognito/private window</li>
                </ul>
              </li>
              <li>
                <strong>Network/Firewall:</strong>
                <ul>
                  <li>Check if your network blocks googleapis.com</li>
                  <li>Try connecting from a different network</li>
                </ul>
              </li>
            </ol>
            <p>
              <strong>Quick Test:</strong> Try opening this in an incognito window - 
              if it works there, it's definitely an extension causing the issue.
            </p>
          </div>
        )}

        <div className="technical-info">
          <details>
            <summary>Technical Details</summary>
            <p>Error: <code>net::ERR_BLOCKED_BY_CLIENT</code></p>
            <p>Blocked URLs: supabase.co</p>
            <p>
              This error occurs when browser extensions or network settings 
              prevent connections to Supabase services.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};

export default SupabaseBlockedError;
