// User role management utility
import { doc, setDoc, getDoc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    canTakeTests: true,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: true,
    canSubmitSolutions: true
  },
  [USER_ROLES.ADMIN]: {
    canTakeTests: false,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: false,
    canSubmitSolutions: false,
    canViewStudents: true,
    canViewAllResults: true,
    canManageTests: true,
    canGenerateReports: true,
    canViewSubmissions: true
  },
  [USER_ROLES.SUPER_ADMIN]: {
    canTakeTests: false,
    canViewOwnResults: true,
    canAccessDashboard: true,
    canViewProblems: false,
    canSubmitSolutions: false,
    canViewStudents: true,
    canViewAllResults: true,
    canManageTests: true,
    canGenerateReports: true,
    canViewSubmissions: true,
    canManageUsers: true,
    canManageAdmins: true,
    canModifyPermissions: true,
    canViewSystemStats: true,
    canAccessSecretLogin: true,
    canDeleteUsers: true,
    canResetPasswords: true,
    canViewAuditLogs: true
  }
};

/**
 * Create user profile with role in Firestore
 */
export const createUserProfile = async (user, role = USER_ROLES.STUDENT, additionalData = {}) => {
  if (!user || !user.uid) {
    throw new Error('User object is required');
  }

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const userDocRef = doc(db, 'users', user.uid);
  
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    role: role,
    permissions: ROLE_PERMISSIONS[role],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isActive: true,
    ...additionalData
  };

  try {
    await setDoc(userDocRef, userData, { merge: true });
    console.log(`✅ User profile created with role: ${role}`);
    return userData;
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile and role from Firestore
 */
export const getUserProfile = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        ...userData,
        permissions: ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS[USER_ROLES.STUDENT]
      };
    } else {
      // If user profile doesn't exist, create a default student profile
      console.log('User profile not found, creating default student profile');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user role (only Super Admin can do this)
 */
export const updateUserRole = async (userId, newRole, updatedBy) => {
  if (!userId || !newRole || !updatedBy) {
    throw new Error('User ID, new role, and updater ID are required');
  }

  if (!Object.values(USER_ROLES).includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData = {
      role: newRole,
      permissions: ROLE_PERMISSIONS[newRole],
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy,
      roleHistory: {
        previousRole: '', // You can get this from current data first
        newRole: newRole,
        changedAt: new Date().toISOString(),
        changedBy: updatedBy
      }
    };

    await updateDoc(userDocRef, updateData);
    console.log(`✅ User role updated to: ${newRole}`);
    return updateData;
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    throw error;
  }
};

/**
 * Get all users by role (Admin and Super Admin access)
 */
export const getUsersByRole = async (role = null) => {
  try {
    let q;
    if (role) {
      q = query(collection(db, 'users'), where('role', '==', role), where('isActive', '==', true));
    } else {
      q = query(collection(db, 'users'), where('isActive', '==', true));
    }

    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return users;
  } catch (error) {
    console.error('❌ Error fetching users by role:', error);
    throw error;
  }
};

/**
 * Get all active students (for Admin dashboard)
 */
export const getActiveStudents = async () => {
  return await getUsersByRole(USER_ROLES.STUDENT);
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions && permissions[permission] === true;
};

/**
 * Get user test submissions and results
 */
export const getUserTestResults = async (userId) => {
  try {
    const resultsQuery = query(
      collection(db, 'testResults'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(resultsQuery);
    const results = [];

    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  } catch (error) {
    console.error('❌ Error fetching user test results:', error);
    throw error;
  }
};

/**
 * Get all test submissions (for Admin dashboard)
 */
export const getAllTestResults = async () => {
  try {
    const resultsQuery = collection(db, 'testResults');
    const querySnapshot = await getDocs(resultsQuery);
    const results = [];

    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  } catch (error) {
    console.error('❌ Error fetching all test results:', error);
    throw error;
  }
};

/**
 * Save test results to Firestore
 */
export const saveTestResults = async (userId, testData) => {
  try {
    const resultsRef = collection(db, 'testResults');
    const resultData = {
      userId: userId,
      ...testData,
      submittedAt: new Date().toISOString()
    };

    await setDoc(doc(resultsRef), resultData);
    console.log('✅ Test results saved successfully');
    return resultData;
  } catch (error) {
    console.error('❌ Error saving test results:', error);
    throw error;
  }
};

/**
 * Update user last login time
 */
export const updateLastLogin = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      lastLoginAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating last login:', error);
    // Don't throw error - this is not critical
  }
};

/**
 * Deactivate user (soft delete)
 */
export const deactivateUser = async (userId, deactivatedBy) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      isActive: false,
      deactivatedAt: new Date().toISOString(),
      deactivatedBy: deactivatedBy
    });
    console.log('✅ User deactivated successfully');
  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    throw error;
  }
};

/**
 * Super admin login verification
 */
export const SUPER_ADMIN_CONFIG = {
  secretCode: 'CODEBUD_SUPER_ADMIN_2025' // Change this to your secret code
};

export const verifySuperAdminAccess = (secretCode) => {
  return secretCode === SUPER_ADMIN_CONFIG.secretCode;
};
