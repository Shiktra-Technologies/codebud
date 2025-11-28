import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import Loading from '../components/Loading';
import { 
  createUserProfile, 
  getUserProfile, 
  USER_ROLES, 
  ROLE_PERMISSIONS,
  hasPermission, 
  updateLastLogin,
  verifySuperAdminAccess 
} from '../utils/roleManager';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('AuthContext: Timeout reached, forcing loading to false');
      if (loading) {
        setLoading(false);
        // If still no user after timeout, assume not logged in
        if (!currentUser) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading, currentUser]);

  // Sign up with email and password and role
  const signup = async (email, password, role = USER_ROLES.STUDENT) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore with role
    await createUserProfile(user, role);
    
    return userCredential;
  };

  // Sign in with email and password
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login time
    await updateLastLogin(user.uid);
    
    return userCredential;
  };

  // Super admin login with just secret code (no email/password needed)
  const superAdminLogin = async (secretCode) => {
    // Verify super admin access with just the secret code
    if (secretCode !== 'CODEBUD_SUPER_ADMIN_2025') {
      throw new Error('Invalid super admin secret code');
    }

    // Create a temporary super admin session
    // Using a special super admin user ID for session management
    const superAdminData = {
      uid: 'super_admin_session',
      email: 'superadmin@codebud.com',
      displayName: 'Super Administrator',
      role: USER_ROLES.SUPER_ADMIN,
      permissions: ROLE_PERMISSIONS[USER_ROLES.SUPER_ADMIN],
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Set the current user to super admin directly
    setCurrentUser({
      uid: superAdminData.uid,
      email: superAdminData.email,
      displayName: superAdminData.displayName
    });
    
    setUserProfile(superAdminData);
    
    return { user: superAdminData };
  };

  // Sign out
  const logout = async () => {
    // Handle super admin logout differently
    if (currentUser && currentUser.uid === 'super_admin_session') {
      setCurrentUser(null);
      setUserProfile(null);
      return Promise.resolve();
    }
    
    // Regular Firebase logout
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update profile
  const updateUserProfile = (updates) => {
    return updateProfile(auth.currentUser, updates);
  };

  // Sign in with Google
  const signInWithGoogle = async (role = USER_ROLES.STUDENT) => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists, if not create with specified role
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      await createUserProfile(user, role);
    } else {
      await updateLastLogin(user.uid);
    }

    return userCredential;
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    let authListenerSetup = false;
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        authListenerSetup = true;
        console.log('AuthContext: Auth state changed, user:', user ? 'logged in' : 'not logged in');
        setCurrentUser(user);
        
        if (user) {
          try {
            console.log('AuthContext: Fetching user profile for:', user.uid);
            // Fetch user profile from Firestore
            const profile = await getUserProfile(user.uid);
            if (!profile) {
              console.log('AuthContext: No profile found, creating default student profile');
              // Create default student profile if none exists
              const newProfile = await createUserProfile(user, USER_ROLES.STUDENT);
              setUserProfile(newProfile);
            } else {
              console.log('AuthContext: Profile loaded:', profile.role);
              setUserProfile(profile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Create default profile on error
            try {
              const newProfile = await createUserProfile(user, USER_ROLES.STUDENT);
              setUserProfile(newProfile);
            } catch (createError) {
              console.error('Error creating user profile:', createError);
              setUserProfile(null);
            }
          }
        } else {
          console.log('AuthContext: No user, clearing profile');
          setUserProfile(null);
        }
        
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      });

      // Additional timeout in case auth listener never fires
      setTimeout(() => {
        if (!authListenerSetup) {
          console.error('AuthContext: Auth listener never fired, forcing loading to false');
          setLoading(false);
          setCurrentUser(null);
          setUserProfile(null);
        }
      }, 3000);

      return unsubscribe;
    } catch (error) {
      console.error('AuthContext: Failed to set up auth listener:', error);
      setLoading(false);
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  // Helper functions
  const hasUserPermission = (permission) => {
    if (!userProfile) return false;
    return hasPermission(userProfile.role, permission);
  };

  const isStudent = () => userProfile?.role === USER_ROLES.STUDENT;
  const isAdmin = () => userProfile?.role === USER_ROLES.ADMIN;
  const isSuperAdmin = () => userProfile?.role === USER_ROLES.SUPER_ADMIN;

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    superAdminLogin,
    logout,
    resetPassword,
    updateUserProfile,
    signInWithGoogle,
    hasUserPermission,
    isStudent,
    isAdmin,
    isSuperAdmin,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loading /> : children}
    </AuthContext.Provider>
  );
}
