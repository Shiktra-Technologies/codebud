import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  saveUserToFirestore,
  getUserFromFirestore,
  getAllUsersFromFirestore,
  updateUserActivity,
  syncPendingSubmissions
} from '../services/firestoreService';

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

  // Helper function to get all registered users (Firestore + localStorage fallback)
  const getAllUsers = async () => {
    const result = await getAllUsersFromFirestore();
    return result.data || [];
  };

  // Helper function to save user data (Firestore + localStorage fallback)
  const saveUserData = async (user, role) => {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'active'
    };

    // Save to Firestore (with automatic localStorage fallback)
    await saveUserToFirestore(user.uid, userData);
    
    return userData;
  };

  // Function to update user's last active time (Firestore + localStorage fallback)
  const updateLastActive = async (userId) => {
    await updateUserActivity(userId);
  };

  // Simple signup with email/password (defaults to student role)
  const signup = async (email, password, role = USER_ROLES.STUDENT) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Store role in localStorage as fallback when Firestore is blocked
    localStorage.setItem(`user_role_${userCredential.user.uid}`, role);
    
    // Save user data to our user registry
    saveUserData(userCredential.user, role);
    
    setUserRole(role);
    return userCredential;
  };

  // Simple login with email/password (now accepts optional role override)
  const login = async (email, password, roleOverride = null) => {
    console.log('🔑 Login attempt with role override:', roleOverride);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Use role override if provided, otherwise try to get from localStorage
    const storedRole = localStorage.getItem(`user_role_${userCredential.user.uid}`) || USER_ROLES.STUDENT;
    const finalRole = roleOverride || storedRole;
    
    console.log('🔑 Login - Stored role:', storedRole);
    console.log('🔑 Login - Final role:', finalRole);
    
    // Update role in localStorage if overridden
    if (roleOverride) {
      localStorage.setItem(`user_role_${userCredential.user.uid}`, roleOverride);
      console.log('🔑 Login - Updated localStorage with role:', roleOverride);
    }
    
    // Update user's last active time and save data with the final role
    await saveUserData(userCredential.user, finalRole);
    await updateLastActive(userCredential.user.uid);
    
    setUserRole(finalRole);
    console.log('🔑 Login - Set user role in context:', finalRole);
    return userCredential;
  };

  // Super admin login with secret code
  const superAdminLogin = async (secretCode) => {
    if (secretCode === 'admin@2024') {
      // Create mock super admin user
      const mockUser = {
        uid: 'super_admin_session',
        email: 'superadmin@codebud.com',
        displayName: 'Super Admin'
      };
      
      setCurrentUser(mockUser);
      setUserRole(USER_ROLES.SUPER_ADMIN);
      localStorage.setItem(`user_role_${mockUser.uid}`, USER_ROLES.SUPER_ADMIN);
      
      return { user: mockUser };
    } else {
      throw new Error('Invalid secret code');
    }
  };

  // Logout
  const logout = async () => {
    if (currentUser && currentUser.uid === 'super_admin_session') {
      // Handle super admin logout
      setCurrentUser(null);
      setUserRole(null);
      return Promise.resolve();
    }
    
    // Clear stored role
    if (currentUser) {
      localStorage.removeItem(`user_role_${currentUser.uid}`);
    }
    
    setUserRole(null);
    return signOut(auth);
  };

  useEffect(() => {
    console.log('SimpleAuth: Setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('SimpleAuth: Auth state changed:', user ? 'logged in' : 'not logged in');
      
      setCurrentUser(user);
      
      if (user) {
        // Get role from localStorage
        const storedRole = localStorage.getItem(`user_role_${user.uid}`) || USER_ROLES.STUDENT;
        console.log('SimpleAuth: Using stored role:', storedRole);
        setUserRole(storedRole);
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
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Helper functions
  const isStudent = () => userRole === USER_ROLES.STUDENT;
  const isAdmin = () => userRole === USER_ROLES.ADMIN;
  const isSuperAdmin = () => userRole === USER_ROLES.SUPER_ADMIN;

  const value = {
    currentUser,
    userRole,
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
    isOnline
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
