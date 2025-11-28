import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import AdminDashboard from './AdminDashboard';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const { userRole, isSuperAdmin, currentUser, USER_ROLES, getAllUsers } = useSimpleAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin()) {
      setError('Access denied. Super Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchData();
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get real registered users from localStorage
      const realUsers = getAllUsers();
      
      // Get test results from localStorage
      const storedResults = localStorage.getItem('test_results');
      const testResultsData = storedResults ? JSON.parse(storedResults) : [];

      // Format users with additional computed fields
      const usersWithStats = realUsers.map(user => ({
        ...user,
        lastActive: user.lastLogin,
        testsCompleted: testResultsData.filter(result => result.userId === user.uid).length
      }));

      setAllUsers(usersWithStats);
      setTestResults(testResultsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Update role in localStorage registry
      const users = getAllUsers();
      const updatedUsers = users.map(user => 
        user.uid === userId ? { ...user, role: newRole } : user
      );
      localStorage.setItem('all_registered_users', JSON.stringify(updatedUsers));
      
      // Update role in individual user's role storage
      localStorage.setItem(`user_role_${userId}`, newRole);
      
      // Update local state
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      setShowUserModal(false);
      setSelectedUser(null);
      alert(`User role updated to ${newRole} successfully!`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role: ' + error.message);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (userId === currentUser.uid) {
      alert('Cannot deactivate your own account');
      return;
    }

    if (window.confirm('Are you sure you want to deactivate this user? This action cannot be undone.')) {
      try {
        // Update user status in localStorage registry
        const users = getAllUsers();
        const updatedUsers = users.map(user => 
          user.uid === userId ? { ...user, status: 'inactive' } : user
        );
        localStorage.setItem('all_registered_users', JSON.stringify(updatedUsers));
        
        // Update local state
        setAllUsers(prevUsers => 
          prevUsers.map(user => 
            user.uid === userId ? { ...user, status: 'inactive' } : user
          )
        );
        setShowUserModal(false);
        setSelectedUser(null);
        alert('User deactivated successfully!');
      } catch (error) {
        console.error('Error deactivating user:', error);
        alert('Failed to deactivate user: ' + error.message);
      }
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateSystemStats = () => {
    const students = allUsers.filter(u => u.role === USER_ROLES.STUDENT);
    const admins = allUsers.filter(u => u.role === USER_ROLES.ADMIN);
    const superAdmins = allUsers.filter(u => u.role === USER_ROLES.SUPER_ADMIN);
    const totalSubmissions = testResults.length;
    const violationSubmissions = testResults.filter(r => r.violations?.submittedDueToViolation).length;
    const passedTests = testResults.filter(r => r.passed).length;

    return {
      totalUsers: allUsers.length,
      students: students.length,
      admins: admins.length,
      superAdmins: superAdmins.length,
      totalSubmissions,
      violationSubmissions,
      passedTests,
      passRate: totalSubmissions > 0 ? Math.round((passedTests / totalSubmissions) * 100) : 0
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.STUDENT: return '#28a745';
      case USER_ROLES.ADMIN: return '#ffc107';
      case USER_ROLES.SUPER_ADMIN: return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case USER_ROLES.STUDENT: return 'Student';
      case USER_ROLES.ADMIN: return 'Admin';
      case USER_ROLES.SUPER_ADMIN: return 'Super Admin';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="super-admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="super-admin-dashboard">
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = calculateSystemStats();

  return (
    <div className="super-admin-dashboard">
      <div className="super-admin-header">
        <h1>🔐 Super Admin Dashboard</h1>
        <p>System Administration & User Management</p>
        <p className="welcome-text">Welcome, {currentUser?.displayName || currentUser?.email || 'Super Admin'}</p>
      </div>

      {/* Tab Navigation */}
      <div className="super-admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          System Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👥</span>
          User Management
        </button>
        <button
          className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <span className="tab-icon">👨‍💼</span>
          Admin View
        </button>
      </div>

      {/* Tab Content */}
      <div className="super-admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>System Statistics</h2>
            
            <div className="super-stats-grid">
              <div className="super-stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">🎓</div>
                <div className="stat-content">
                  <h3>{stats.students}</h3>
                  <p>Students</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">👨‍💼</div>
                <div className="stat-content">
                  <h3>{stats.admins}</h3>
                  <p>Admins</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">🔐</div>
                <div className="stat-content">
                  <h3>{stats.superAdmins}</h3>
                  <p>Super Admins</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <h3>{stats.totalSubmissions}</h3>
                  <p>Total Submissions</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-content">
                  <h3>{stats.violationSubmissions}</h3>
                  <p>Violation Submissions</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{stats.passedTests}</h3>
                  <p>Passed Tests</p>
                </div>
              </div>
              
              <div className="super-stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>{stats.passRate}%</h3>
                  <p>Pass Rate</p>
                </div>
              </div>
            </div>

            <div className="system-health">
              <h3>System Health</h3>
              <div className="health-indicators">
                <div className="health-item">
                  <span className="health-status good">🟢</span>
                  <span>Authentication System</span>
                </div>
                <div className="health-item">
                  <span className="health-status good">🟢</span>
                  <span>Database Connection</span>
                </div>
                <div className="health-item">
                  <span className="health-status good">🟢</span>
                  <span>Proctoring System</span>
                </div>
                <div className="health-item">
                  <span className="health-status warning">🟡</span>
                  <span>Performance Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management-section">
            <div className="section-header">
              <h2>User Management</h2>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.uid}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="Avatar" />
                            ) : (
                              <div className="avatar-placeholder">
                                {(user.displayName || user.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="user-details">
                            <strong>{user.displayName || 'No name'}</strong>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="role-badge" 
                          style={{ backgroundColor: getRoleColor(user.role) }}
                        >
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                          >
                            ✏️
                          </button>
                          {user.uid !== currentUser.uid && (
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeactivateUser(user.uid)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-view-section">
            <AdminDashboard />
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage User: {selectedUser.displayName || selectedUser.email}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-details-full">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Current Role:</strong> {getRoleDisplay(selectedUser.role)}</p>
                <p><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</p>
                <p><strong>Last Login:</strong> {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}</p>
              </div>

              <div className="role-change-section">
                <h4>Change User Role</h4>
                <div className="role-buttons">
                  {Object.values(USER_ROLES).map(role => (
                    <button
                      key={role}
                      className={`role-change-btn ${selectedUser.role === role ? 'current' : ''}`}
                      onClick={() => handleRoleChange(selectedUser.uid, role)}
                      disabled={selectedUser.role === role || selectedUser.uid === currentUser.uid}
                    >
                      {getRoleDisplay(role)}
                      {selectedUser.role === role && ' (Current)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="permissions-display">
                <h4>Current Permissions</h4>
                <div className="permissions-grid">
                  {Object.entries(ROLE_PERMISSIONS[selectedUser.role] || {}).map(([permission, allowed]) => (
                    <div key={permission} className={`permission-item ${allowed ? 'allowed' : 'denied'}`}>
                      <span className="permission-icon">{allowed ? '✅' : '❌'}</span>
                      <span className="permission-name">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="dashboard-actions">
        <button onClick={fetchData} className="refresh-button" disabled={loading}>
          🔄 Refresh System Data
        </button>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
