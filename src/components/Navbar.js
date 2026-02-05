import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, loading, isAdmin } = useSimpleAuth();
  const location = useLocation();

  // Don't render navbar during authentication loading or when not logged in
  if (loading || !currentUser) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo">CB</div>
          <span className="brand-text">CodeBud</span>
        </Link>

        {/* Center Admin Badge */}
        <div className="navbar-center">
          {isAdmin() && (
            <Link to="/admin" className="admin-badge-link">
              <div className="admin-badge-container">
                <svg className="admin-badge-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
                <span className="admin-badge-text">ADMIN</span>
              </div>
            </Link>
          )}
        </div>

        {/* Right side - Empty for clean design */}
        <div className="navbar-actions">
          {/* Future: Notifications, Quick actions, etc. */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
