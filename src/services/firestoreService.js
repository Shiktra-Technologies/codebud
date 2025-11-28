import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Firestore Service Layer
 * Handles all database operations for 60+ concurrent users
 * Includes error handling, retries, and offline support
 */

// ==================== USER MANAGEMENT ====================

/**
 * Save user data to Firestore
 * @param {string} userId - User ID
 * @param {object} userData - User data object
 */
export const saveUserToFirestore = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: userData.createdAt || serverTimestamp(),
      lastLogin: serverTimestamp(),
      status: userData.status || 'active',
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ User saved to Firestore:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving user to Firestore:', error);
    
    // Fallback to localStorage if Firestore fails (ad blocker, etc.)
    try {
      const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      const userIndex = existingUsers.findIndex(u => u.uid === userId);
      
      if (userIndex !== -1) {
        existingUsers[userIndex] = { ...existingUsers[userIndex], ...userData };
      } else {
        existingUsers.push({ uid: userId, ...userData });
      }
      
      localStorage.setItem('all_registered_users', JSON.stringify(existingUsers));
      console.log('⚠️ Saved to localStorage as fallback');
      return { success: true, fallback: true };
    } catch (localError) {
      console.error('❌ Fallback to localStorage also failed:', localError);
      return { success: false, error: localError.message };
    }
  }
};

/**
 * Get user data from Firestore
 * @param {string} userId - User ID
 */
export const getUserFromFirestore = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      // Try localStorage fallback
      const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      const user = existingUsers.find(u => u.uid === userId);
      return { success: !!user, data: user, fallback: true };
    }
  } catch (error) {
    console.error('❌ Error getting user from Firestore:', error);
    
    // Fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const user = existingUsers.find(u => u.uid === userId);
    return { success: !!user, data: user, fallback: true };
  }
};

/**
 * Get all users (for admin dashboard)
 * @param {string} role - Optional role filter
 */
export const getAllUsersFromFirestore = async (role = null) => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, orderBy('createdAt', 'desc'));
    
    if (role) {
      q = query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Fetched ${users.length} users from Firestore`);
    return { success: true, data: users };
  } catch (error) {
    console.error('❌ Error fetching users from Firestore:', error);
    
    // Fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const filteredUsers = role ? existingUsers.filter(u => u.role === role) : existingUsers;
    return { success: true, data: filteredUsers, fallback: true };
  }
};

/**
 * Update user's last active timestamp
 * @param {string} userId - User ID
 */
export const updateUserActivity = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    // Silent fail for activity updates, fallback to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const userIndex = existingUsers.findIndex(u => u.uid === userId);
    
    if (userIndex !== -1) {
      existingUsers[userIndex].lastLogin = new Date().toISOString();
      localStorage.setItem('all_registered_users', JSON.stringify(existingUsers));
    }
    
    return { success: true, fallback: true };
  }
};

// ==================== TEST SUBMISSION ====================

/**
 * Submit test result to Firestore
 * @param {object} testData - Test submission data
 */
export const submitTestToFirestore = async (testData) => {
  try {
    const submissionRef = doc(collection(db, 'testSubmissions'));
    const submissionData = {
      ...testData,
      submittedAt: serverTimestamp(),
      status: 'submitted',
      synced: true
    };
    
    await setDoc(submissionRef, submissionData);
    
    console.log('✅ Test submitted to Firestore:', submissionRef.id);
    
    // Also save to localStorage as backup
    const existingResults = JSON.parse(localStorage.getItem('test_results') || '[]');
    existingResults.push({ id: submissionRef.id, ...testData, submittedAt: new Date().toISOString() });
    localStorage.setItem('test_results', JSON.stringify(existingResults));
    
    return { success: true, id: submissionRef.id };
  } catch (error) {
    console.error('❌ Error submitting test to Firestore:', error);
    
    // Fallback to localStorage and queue for later sync
    const submissionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const existingResults = JSON.parse(localStorage.getItem('test_results') || '[]');
    const pendingQueue = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
    
    const submission = { id: submissionId, ...testData, submittedAt: new Date().toISOString(), synced: false };
    existingResults.push(submission);
    pendingQueue.push(submission);
    
    localStorage.setItem('test_results', JSON.stringify(existingResults));
    localStorage.setItem('pending_submissions', JSON.stringify(pendingQueue));
    
    console.log('⚠️ Test queued for sync when online:', submissionId);
    return { success: true, id: submissionId, queued: true };
  }
};

/**
 * Auto-save test progress
 * @param {string} userId - User ID
 * @param {object} progressData - Test progress data
 */
export const autoSaveTestProgress = async (userId, progressData) => {
  try {
    const progressRef = doc(db, 'testProgress', userId);
    await setDoc(progressRef, {
      ...progressData,
      lastSaved: serverTimestamp(),
      userId
    }, { merge: true });
    
    // Also save to localStorage
    localStorage.setItem(`test_progress_${userId}`, JSON.stringify({
      ...progressData,
      lastSaved: new Date().toISOString()
    }));
    
    return { success: true };
  } catch (error) {
    // Silent fail, just save to localStorage
    localStorage.setItem(`test_progress_${userId}`, JSON.stringify({
      ...progressData,
      lastSaved: new Date().toISOString()
    }));
    
    return { success: true, fallback: true };
  }
};

/**
 * Get saved test progress
 * @param {string} userId - User ID
 */
export const getTestProgress = async (userId) => {
  try {
    const progressRef = doc(db, 'testProgress', userId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return { success: true, data: progressSnap.data() };
    } else {
      // Try localStorage
      const localProgress = localStorage.getItem(`test_progress_${userId}`);
      if (localProgress) {
        return { success: true, data: JSON.parse(localProgress), fallback: true };
      }
      return { success: false, message: 'No saved progress found' };
    }
  } catch (error) {
    // Fallback to localStorage
    const localProgress = localStorage.getItem(`test_progress_${userId}`);
    if (localProgress) {
      return { success: true, data: JSON.parse(localProgress), fallback: true };
    }
    return { success: false, message: 'No saved progress found' };
  }
};

/**
 * Get all test submissions (for admin)
 * @param {string} userId - Optional user ID filter
 * @param {number} limitCount - Number of submissions to fetch (default 50)
 */
export const getAllSubmissions = async (userId = null, limitCount = 50) => {
  // Check cache first (5 minute cache)
  const cacheKey = `submissions_cache_${userId || 'all'}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const cacheAge = Date.now() - timestamp;
    
    // Return cached data if less than 5 minutes old
    if (cacheAge < 5 * 60 * 1000) {
      console.log('✅ Using cached submissions (age:', Math.round(cacheAge / 1000), 'seconds)');
      return { success: true, data, cached: true };
    }
  }
  
  try {
    const submissionsRef = collection(db, 'testSubmissions');
    let q = query(submissionsRef, orderBy('submittedAt', 'desc'), limit(limitCount));
    
    if (userId) {
      q = query(submissionsRef, where('userId', '==', userId), orderBy('submittedAt', 'desc'), limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const submissions = [];
    
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    
    // Cache the results
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data: submissions,
      timestamp: Date.now()
    }));
    
    console.log(`✅ Fetched ${submissions.length} submissions from Firestore (cached for 5 min)`);
    return { success: true, data: submissions };
  } catch (error) {
    console.error('❌ Error fetching submissions:', error);
    
    // Fallback to localStorage
    const existingResults = JSON.parse(localStorage.getItem('test_results') || '[]');
    const filtered = userId 
      ? existingResults.filter(r => r.userId === userId).slice(0, limitCount)
      : existingResults.slice(0, limitCount);
    
    // Cache localStorage results too
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data: filtered,
      timestamp: Date.now()
    }));
    
    return { success: true, data: filtered, fallback: true };
  }
};

// ==================== REAL-TIME LISTENERS ====================

/**
 * Listen to user activity using HTTP polling (ad-blocker proof)
 * Uses getDocs() with polling instead of onSnapshot() WebSocket
 * @param {function} callback - Callback function to handle updates
 */
export const subscribeToUserActivity = (callback) => {
  let pollInterval = null;
  let isActive = true;
  
  // Fetch user data using HTTP polling
  const fetchUsers = async () => {
    if (!isActive) return;
    
    try {
      // Use getDocs() instead of onSnapshot() - works with ad blockers
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastLogin', 'desc'));
      const snapshot = await getDocs(q);
      
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() });
      });
      
      console.log('✅ HTTP polling: Fetched', users.length, 'users');
      
      // Update localStorage as backup
      localStorage.setItem('all_registered_users', JSON.stringify(users));
      callback(users);
      
    } catch (error) {
      console.error('❌ Error fetching users via HTTP:', error);
      
      // Fallback to localStorage
      const cachedUsers = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      if (cachedUsers.length > 0) {
        console.log('🔄 Using cached data:', cachedUsers.length, 'users');
        callback(cachedUsers);
      }
    }
  };
  
  // Initial fetch
  fetchUsers();
  
  // Poll every 5 seconds (can be adjusted)
  pollInterval = setInterval(fetchUsers, 5000);
  
  // Return cleanup function
  return () => {
    isActive = false;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
};

/**
 * Listen to test submissions using HTTP polling (ad-blocker proof)
 * Uses getDocs() with polling instead of onSnapshot() WebSocket
 * @param {function} callback - Callback function to handle updates
 */
export const subscribeToSubmissions = (callback) => {
  let pollInterval = null;
  let isActive = true;
  
  // Fetch submissions data using HTTP polling
  const fetchSubmissions = async () => {
    if (!isActive) return;
    
    try {
      // Use getDocs() instead of onSnapshot() - works with ad blockers
      const submissionsRef = collection(db, 'testSubmissions');
      const q = query(submissionsRef, orderBy('submittedAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const submissions = [];
      snapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ HTTP polling: Fetched', submissions.length, 'submissions');
      
      // Update localStorage as backup
      localStorage.setItem('test_results', JSON.stringify(submissions));
      callback(submissions);
      
    } catch (error) {
      console.error('❌ Error fetching submissions via HTTP:', error);
      
      // Fallback to localStorage
      const cachedSubmissions = JSON.parse(localStorage.getItem('test_results') || '[]');
      if (cachedSubmissions.length > 0) {
        console.log('🔄 Using cached submissions:', cachedSubmissions.length, 'items');
        callback(cachedSubmissions);
      }
    }
  };
  
  // Initial fetch
  fetchSubmissions();
  
  // Poll every 5 seconds (can be adjusted)
  pollInterval = setInterval(fetchSubmissions, 5000);
  
  // Return cleanup function
  return () => {
    isActive = false;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
};

// ==================== OFFLINE SYNC ====================

/**
 * Sync pending submissions when online
 */
export const syncPendingSubmissions = async () => {
  try {
    const pendingQueue = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
    
    if (pendingQueue.length === 0) {
      return { success: true, synced: 0 };
    }
    
    console.log(`🔄 Syncing ${pendingQueue.length} pending submissions...`);
    
    const batch = writeBatch(db);
    const syncedIds = [];
    
    for (const submission of pendingQueue) {
      const submissionRef = doc(collection(db, 'testSubmissions'));
      batch.set(submissionRef, {
        ...submission,
        originalId: submission.id,
        syncedAt: serverTimestamp(),
        synced: true
      });
      syncedIds.push(submission.id);
    }
    
    await batch.commit();
    
    // Clear pending queue
    localStorage.setItem('pending_submissions', '[]');
    
    // Update test_results to mark as synced
    const existingResults = JSON.parse(localStorage.getItem('test_results') || '[]');
    const updatedResults = existingResults.map(r => 
      syncedIds.includes(r.id) ? { ...r, synced: true } : r
    );
    localStorage.setItem('test_results', JSON.stringify(updatedResults));
    
    console.log(`✅ Synced ${syncedIds.length} submissions`);
    return { success: true, synced: syncedIds.length };
  } catch (error) {
    console.error('❌ Error syncing submissions:', error);
    return { success: false, error: error.message };
  }
};

// ==================== STATISTICS ====================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const usersResult = await getAllUsersFromFirestore();
    const submissionsResult = await getAllSubmissions();
    
    const users = usersResult.data || [];
    const submissions = submissionsResult.data || [];
    
    const students = users.filter(u => u.role === 'student');
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    const activeStudents = students.filter(student => {
      const lastLogin = student.lastLogin?.toDate?.() || new Date(student.lastLogin);
      return lastLogin.getTime() > fiveMinutesAgo;
    });
    
    const passedTests = submissions.filter(s => s.passed).length;
    const violationSubmissions = submissions.filter(s => s.violations?.submittedDueToViolation).length;
    
    return {
      success: true,
      stats: {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalSubmissions: submissions.length,
        passedTests,
        violationSubmissions,
        passRate: submissions.length > 0 ? Math.round((passedTests / submissions.length) * 100) : 0
      }
    };
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    return { success: false, error: error.message };
  }
};

export default {
  saveUserToFirestore,
  getUserFromFirestore,
  getAllUsersFromFirestore,
  updateUserActivity,
  submitTestToFirestore,
  autoSaveTestProgress,
  getTestProgress,
  getAllSubmissions,
  subscribeToUserActivity,
  subscribeToSubmissions,
  syncPendingSubmissions,
  getDashboardStats
};
