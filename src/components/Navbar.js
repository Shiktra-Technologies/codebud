import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userRole, logout, isStudent, isAdmin, isSuperAdmin } = useSimpleAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (!currentUser) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <div className="logo-container">
              <div className="logo-icon">🎯</div>
              <span className="brand-name">CodeBud</span>
              <span className="brand-tagline">Pro Assessment</span>
            </div>
          </Link>
        </div>

        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            Dashboard
          </Link>
          
          {/* Student-only navigation */}
          {isStudent() && (
            <>
              <Link 
                to="/problems" 
                className={`nav-link ${isActive('/problems') ? 'active' : ''}`}
              >
                <span className="nav-icon">💻</span>
                Problems
              </Link>
            </>
          )}
          
          {/* Show role badge */}
          {userRole && (
            <div className="role-badge">
              <span className={`role-indicator ${userRole}`}>
                {userRole === 'super_admin' ? '🔐' : 
                 userRole === 'admin' ? '👨‍💼' : '🎓'}
                {userRole === 'super_admin' ? 'Super Admin' :
                 userRole === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>
          )}
        </div>
        
        <div className="navbar-user">
          <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="user-avatar">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" />
              ) : (
                <span className="avatar-text">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">
                {currentUser.displayName || 'User'}
              </span>
              <span className="user-email">
                {currentUser.email}
              </span>
            </div>
            <div className="dropdown-arrow">
              <span className={`arrow ${isProfileOpen ? 'open' : ''}`}>▼</span>
            </div>
          </div>

          {isProfileOpen && (
            <div className="user-dropdown">
              <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                <span className="dropdown-icon">👤</span>
                Profile
              </Link>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                <span className="dropdown-icon">🚪</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
