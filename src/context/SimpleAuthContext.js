import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';
import {
  saveUserToSupabase,
  getUserFromSupabase,
  getAllUsersFromSupabase,
  updateUserActivity,
  syncPendingSubmissions
} from '../services/supabaseService';

const SimpleAuthContext = createContext();

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export function SimpleAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setIsOnline(true);
      // Sync pending submissions when back online
      syncPendingSubmissions();
    };
    
    const handleOffline = () => {
      console.log('📡 Connection lost - working offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper function to get all registered users (Supabase + localStorage fallback)
  const getAllUsers = async () => {
    const result = await getAllUsersFromSupabase();
    return result.data || [];
  };

  // Helper function to save user data (Supabase + localStorage fallback)
  const saveUserData = async (user, role) => {
    const userData = {
      uid: user.id,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'active'
    };

    // Save to Supabase (with automatic localStorage fallback)
    await saveUserToSupabase(user, role);
    
    return userData;
  };

  // Function to update user's last active time (Supabase + localStorage fallback)
  const updateLastActive = async (userId) => {
    if (userId) {
      await updateUserActivity(userId);
    } else {
      console.warn('⚠️ Cannot update last active: userId is undefined');
    }
  };

  // Simple signup with email/password (defaults to student role)
  const signup = async (email, password, role = USER_ROLES.STUDENT) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        },
        // Set emailRedirectTo for better UX (optional)
        emailRedirectTo: `${window.location.origin}/auth`
      }
    });

    if (error) throw error;
    
    // Check if email confirmation is required
    if (data?.user && !data.session) {
      console.log('📧 Email confirmation required for:', email);
      // Return special indicator that email confirmation is needed
      return { 
        ...data, 
        needsEmailConfirmation: true,
        message: 'Please check your email to confirm your account before signing in.'
      };
    }
    
    // Store role in localStorage as fallback
    if (data.user) {
      localStorage.setItem(`user_role_${data.user.id}`, role);
      
      // Save user data to our user registry
      await saveUserData(data.user, role);
      
      setUserRole(role);
    }
    
    return data;
  };

  // Simple login with email/password - validates user's registered role
  const login = async (email, password, expectedRole = null) => {
    console.log('🔑 Login attempt for email:', email, 'Expected role:', expectedRole);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    
    // Get user's actual role from database
    const userResult = await getUserFromSupabase(data.user.id);
    let actualRole = USER_ROLES.STUDENT; // default fallback
    
    if (userResult.success && userResult.data) {
      actualRole = userResult.data.role;
    } else {
      // Fallback to localStorage
      actualRole = localStorage.getItem(`user_role_${data.user.id}`) || USER_ROLES.STUDENT;
    }
    
    console.log('🔑 Login - User\'s actual role:', actualRole);
    console.log('🔑 Login - Expected role:', expectedRole);
    
    // If expectedRole is specified, validate that user can login with that role
    if (expectedRole && actualRole !== expectedRole) {
      // Sign out the user since they tried to access wrong role
      await supabase.auth.signOut();
      throw new Error(`Access denied. This account is registered as ${actualRole}, but you're trying to login as ${expectedRole}.`);
    }
    
    // Update role in localStorage
    localStorage.setItem(`user_role_${data.user.id}`, actualRole);
    console.log('🔑 Login - Confirmed role in localStorage:', actualRole);
    
    // Update user's last active time
    await updateLastActive(data.user.id);
    
    // Store user for real-time tracking
    localStorage.setItem('authUser', JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0]
    }));
    
    // Import and initialize real-time tracking for this user
    import('../services/realTimeService').then(({ default: realTimeService }) => {
      realTimeService.trackUserActivity(data.user.id, 'logged in');
      // Force refresh active users list
      setTimeout(() => realTimeService.refreshActiveUsers(), 1000);
    });
    
    setUserRole(actualRole);
    console.log('🔑 Login - Set user role in context:', actualRole);
    return { ...data, userRole: actualRole };
  };

  // Super admin login with secret code
  const superAdminLogin = async (secretCode) => {
    if (secretCode === 'admin@2024') {
      // Create mock super admin user
      const mockUser = {
        id: 'super_admin_session',
        email: 'superadmin@codebud.com',
        displayName: 'Super Admin'
      };
      
      setCurrentUser(mockUser);
      setUserRole(USER_ROLES.SUPER_ADMIN);
      localStorage.setItem(`user_role_${mockUser.id}`, USER_ROLES.SUPER_ADMIN);
      
      // Store user for real-time tracking
      localStorage.setItem('authUser', JSON.stringify(mockUser));
      
      // Initialize real-time tracking for super admin
      import('../services/realTimeService').then(({ default: realTimeService }) => {
        realTimeService.trackUserActivity(mockUser.id, 'super admin login');
        // Force refresh active users list
        setTimeout(() => realTimeService.refreshActiveUsers(), 1000);
      });
      
      return { user: mockUser };
    } else {
      throw new Error('Invalid secret code');
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Handle super admin logout (no Supabase auth)
      if (currentUser && currentUser.id === 'super_admin_session') {
        // Clean up super admin data
        localStorage.removeItem(`user_role_${currentUser.id}`);
        localStorage.removeItem('authUser');
        
        // Clean up heartbeat tracking synchronously
        const heartbeatData = JSON.parse(localStorage.getItem('user_heartbeats') || '{}');
        delete heartbeatData[currentUser.id];
        localStorage.setItem('user_heartbeats', JSON.stringify(heartbeatData));
        
        setCurrentUser(null);
        setUserRole(null);
        return;
      }
      
      // Regular user logout
      // Clean up localStorage first (synchronously)
      if (currentUser) {
        localStorage.removeItem(`user_role_${currentUser.id}`);
        localStorage.removeItem('authUser');
        
        // Clean up heartbeat tracking synchronously  
        const heartbeatData = JSON.parse(localStorage.getItem('user_heartbeats') || '{}');
        delete heartbeatData[currentUser.id];
        localStorage.setItem('user_heartbeats', JSON.stringify(heartbeatData));
      }
      
      // Clear state first to prevent UI issues
      setCurrentUser(null);
      setUserRole(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        // Don't throw error - user is already signed out locally
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure user is logged out locally even if Supabase fails
      setCurrentUser(null);
      setUserRole(null);
    }
  };

  useEffect(() => {
    console.log('SimpleAuth: Setting up auth listener');
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('SimpleAuth: Auth state changed:', session?.user ? 'logged in' : 'not logged in');
      
      const user = session?.user || null;
      setCurrentUser(user);
      
      // Store user in localStorage for real-time service
      if (user) {
        localStorage.setItem('authUser', JSON.stringify({
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.displayName || user.email?.split('@')[0]
        }));
      } else {
        localStorage.removeItem('authUser');
      }
      
      if (user) {
        // Get user's actual role from database or localStorage
        const getUserRole = async () => {
          try {
            const userResult = await getUserFromSupabase(user.id);
            if (userResult.success && userResult.data) {
              const actualRole = userResult.data.role;
              localStorage.setItem(`user_role_${user.id}`, actualRole);
              setUserRole(actualRole);
              console.log('SimpleAuth: Set role from database:', actualRole);
            } else {
              // Fallback to localStorage
              const storedRole = localStorage.getItem(`user_role_${user.id}`) || USER_ROLES.STUDENT;
              setUserRole(storedRole);
              console.log('SimpleAuth: Set role from localStorage:', storedRole);
            }
          } catch (error) {
            console.error('SimpleAuth: Error getting user role:', error);
            // Fallback to localStorage
            const storedRole = localStorage.getItem(`user_role_${user.id}`) || USER_ROLES.STUDENT;
            setUserRole(storedRole);
            console.log('SimpleAuth: Set fallback role:', storedRole);
          }
        };
        
        getUserRole();
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      console.log('SimpleAuth: Timeout reached, stopping loading');
      setLoading(false);
    }, 3000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Helper functions
  const isStudent = () => userRole === USER_ROLES.STUDENT;
  const isAdmin = () => userRole === USER_ROLES.ADMIN;
  const isSuperAdmin = () => userRole === USER_ROLES.SUPER_ADMIN;

  // Temporary admin promotion for testing (remove in production)
  const promoteToAdmin = () => {
    if (currentUser) {
      console.log('[DEBUG] Temporarily promoting user to admin for testing');
      setUserRole(USER_ROLES.ADMIN);
      // Also update localStorage
      localStorage.setItem('user_role', USER_ROLES.ADMIN);
      return true;
    }
    return false;
  };

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    login,
    superAdminLogin,
    logout,
    isStudent,
    isAdmin,
    isSuperAdmin,
    USER_ROLES,
    getAllUsers,
    updateLastActive,
    isOnline,
    promoteToAdmin
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Initializing authentication...</p>
      </div>
    );
  }

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}
