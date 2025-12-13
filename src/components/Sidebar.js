import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { useSimpleAuth } from '../context/SimpleAuthContext';

const Sidebar = ({ activeTab, setActiveTab, notificationCounts = {} }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, currentUser, logout } = useSimpleAuth();
  const profileRef = useRef(null);

  const navigationGroups = [
    {
      title: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          )
        },
        {
          id: 'leaderboard',
          label: 'Leaderboard',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 16v5h2a2 2 0 0 0 2-2v-3h-4z"></path>
              <path d="M8 16v5H6a2 2 0 0 1-2-2v-3h4z"></path>
              <path d="M12 11v10"></path>
              <path d="M12 11a5 5 0 0 0 5-5V3h-2a3 3 0 0 0-3 3v5z"></path>
              <path d="M12 11a5 5 0 0 1-5-5V3h2a3 3 0 0 1 3 3v5z"></path>
            </svg>
          )
        }
      ]
    },
    {
      title: 'Academic',
      items: [
        {
          id: 'students',
          label: 'Students',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          )
        },
        {
          id: 'submissions',
          label: 'Submissions',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          ),
          badge: notificationCounts.submissions
        },
        {
          id: 'challenges',
          label: 'Challenges',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          )
        }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'jobs',
          label: 'Job Postings',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          )
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          )
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          id: 'debug',
          label: 'Debug Console',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <path d="M6 12h.01"></path>
              <path d="M10 12h.01"></path>
              <path d="M14 12h.01"></path>
              <path d="M18 12h.01"></path>
            </svg>
          )
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m6-12h-6m6 6h-6m6 6h-6m-6-6H1m6 0H1"></path>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          )
        }
      ]
    }
  ];

  const handleNavigation = (itemId) => {
    // Map sidebar IDs to AdminDashboard tab names
    const tabMapping = {
      'dashboard': 'students', // Default view shows students
      'leaderboard': 'leaderboard',
      'students': 'students',
      'submissions': 'submissions',
      'challenges': 'dsa', // DSA challenges (to be implemented)
      'jobs': 'jobs',
      'reports': 'csv',
      'debug': 'debug',
      'settings': 'settings' // New tab (to be implemented)
    };
    
    setActiveTab(tabMapping[itemId] || itemId);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProfileOpen]);

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header with Toggle */}
        <div className="sidebar-header">
          {!isCollapsed && <span className="sidebar-logo">CodeBud</span>}
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6"></polyline>
              ) : (
                <polyline points="15 18 9 12 15 6"></polyline>
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav">
          {navigationGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="nav-group">
              {!isCollapsed && <div className="nav-group-title">{group.title}</div>}
              <div className="nav-items">
                {group.items.map((item) => {
                  const isActive = 
                    (item.id === 'dashboard' && activeTab === 'students') ||
                    (item.id === 'leaderboard' && activeTab === 'leaderboard') ||
                    (item.id === 'students' && activeTab === 'students') ||
                    (item.id === 'submissions' && activeTab === 'submissions') ||
                    (item.id === 'challenges' && activeTab === 'dsa') ||
                    (item.id === 'jobs' && activeTab === 'jobs') ||
                    (item.id === 'reports' && activeTab === 'csv') ||
                    (item.id === 'debug' && activeTab === 'debug') ||
                    (item.id === 'settings' && activeTab === 'settings');

                  return (
                    <button
                      key={item.id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.id)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="nav-item-icon">{item.icon}</span>
                      {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
                      {item.badge && item.badge > 0 && (
                        <span className="nav-item-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile Section at Bottom */}
        <div className="sidebar-profile" ref={profileRef}>
          <button 
            className={`profile-trigger ${isProfileOpen ? 'active' : ''}`}
            onClick={() => !isCollapsed && setIsProfileOpen(!isProfileOpen)}
            title={isCollapsed ? (currentUser?.displayName || currentUser?.email || 'User') : undefined}
          >
            <div className="profile-avatar">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="profile-details">
                  <div className="profile-name">{currentUser?.displayName || 'User'}</div>
                  <div className="profile-email">{currentUser?.email}</div>
                </div>
                <svg 
                  className={`profile-dropdown-icon ${isProfileOpen ? 'open' : ''}`}
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && !isCollapsed && (
            <div className="profile-dropdown">
              <Link 
                to="/profile" 
                className="dropdown-item"
                onClick={() => setIsProfileOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>View Profile</span>
              </Link>
              
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="dropdown-item logout"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="sidebar-backdrop"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
