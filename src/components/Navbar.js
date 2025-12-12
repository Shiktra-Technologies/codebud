import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userRole, loading, logout, isStudent, isAdmin, isSuperAdmin, promoteToAdmin } = useSimpleAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    try {
      setIsLoggingOut(true);
      setIsProfileOpen(false);
      console.log('[LOGOUT] Starting logout process...');
      await logout();
      console.log('[LOGOUT] Logout successful');
    } catch (error) {
      console.error('[LOGOUT] Failed to logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render navbar during authentication loading or when not logged in
  if (loading || !currentUser) return null;

  const isActive = (path) => location.pathname === path;

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

        {/* Navigation Links - Empty for clean design */}
        <div className="navbar-nav">
        </div>

        {/* User Section */}
        <div className="navbar-user" ref={profileRef}>
          {/* User Profile */}
          <button 
            className="user-profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="user-avatar">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-details">
              <span className="user-name">
                {currentUser.displayName || 'User'}
              </span>
              <span className="user-email">
                {currentUser.email}
              </span>
            </div>
            <svg 
              className={`dropdown-icon ${isProfileOpen ? 'open' : ''}`} 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="dropdown-menu">
              <Link 
                to="/profile" 
                className="dropdown-item"
                onClick={() => setIsProfileOpen(false)}
              >
                <span className="item-icon">Profile</span>
                <span></span>
              </Link>
              
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="dropdown-item logout"
              >
                <span className="item-icon">{isLoggingOut ? 'Loading...' : 'Sign Out'}</span>
                <span></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
