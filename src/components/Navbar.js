import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userRole, loading, logout, isStudent, isAdmin, isSuperAdmin } = useSimpleAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    try {
      setIsLoggingOut(true);
      setIsProfileOpen(false);
      console.log('🚪 Starting logout process...');
      await logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
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
          <div className="brand-logo">💻</div>
          <span className="brand-text">CodeBud</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </Link>
          
          {isStudent() && (
            <Link to="/problems" className={`nav-link ${isActive('/problems') ? 'active' : ''}`}>
              <span className="nav-icon">💻</span>
              <span className="nav-text">Problems</span>
            </Link>
          )}

          {isAdmin() && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <span className="nav-icon">�‍💼</span>
              <span className="nav-text">Admin</span>
            </Link>
          )}
        </div>

        {/* User Section */}
        <div className="navbar-user" ref={profileRef}>
          {/* Role Badge */}
          {userRole && (
            <div className="role-badge">
              <span className={`role-tag ${userRole}`}>
                {userRole === 'super_admin' ? 'Super Admin' :
                 userRole === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>
          )}

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
                <span className="item-icon">👤</span>
                <span>Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="dropdown-item logout"
              >
                <span className="item-icon">{isLoggingOut ? '⏳' : '🚪'}</span>
                <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
