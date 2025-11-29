/**
 * Local Storage Service - Free alternative to Firebase Storage
 * Uses IndexedDB for client-side file storage with real-time updates
 */

import realTimeService from './realTimeService';

// ==================== LOCAL STORAGE CONFIGURATION ====================

const DB_NAME = 'CodeBudStorage';
const DB_VERSION = 1;
const STORE_NAME = 'submissionFiles';

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('testType', 'testType', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('submissionId', 'submissionId', { unique: false });
      }
    };
  });
};

// ==================== FILE UPLOAD FUNCTIONS ====================

/**
 * Upload a submission file to local storage
 * @param {File} file - File to upload
 * @param {string} userId - User ID
 * @param {string} testType - Type of test (dsa, aptitude, etc.)
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Upload result with file info
 */
export const uploadSubmissionFile = async (file, userId, testType, submissionId) => {
  try {
    console.log('📤 Uploading file to local storage:', file.name);
    
    const db = await initDB();
    const timestamp = new Date().toISOString();
    const fileId = `${userId}_${testType}_${submissionId}_${Date.now()}_${file.name}`;
    
    // Convert file to base64 for storage
    const fileData = await fileToBase64(file);
    
    const fileRecord = {
      id: fileId,
      userId,
      testType,
      submissionId,
      name: file.name,
      size: file.size,
      contentType: file.type,
      data: fileData,
      timeCreated: timestamp,
      updated: timestamp,
      fullPath: `submissions/${userId}/${testType}/${timestamp.split('T')[0]}/${submissionId}/${file.name}`
    };
    
    // Store file in IndexedDB
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.add(fileRecord);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ File uploaded successfully to local storage');
    
    return {
      success: true,
      fileId,
      downloadURL: `local://${fileId}`, // Custom URL scheme for local files
      metadata: {
        name: file.name,
        size: file.size,
        contentType: file.type,
        timeCreated: timestamp,
        fullPath: fileRecord.fullPath
      }
    };
    
  } catch (error) {
    console.error('❌ Error uploading file to local storage:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// ==================== FILE RETRIEVAL FUNCTIONS ====================

/**
 * Get all submission files from local storage
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of file records
 */
export const getAllSubmissionFiles = async (filters = {}) => {
  try {
    console.log('📂 Fetching files from local storage with filters:', filters);
    
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const files = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Apply filters
    let filteredFiles = files;
    
    if (filters.userId) {
      filteredFiles = filteredFiles.filter(file => file.userId === filters.userId);
    }
    
    if (filters.testType) {
      filteredFiles = filteredFiles.filter(file => file.testType === filters.testType);
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filteredFiles = filteredFiles.filter(file => {
        const fileDate = new Date(file.timeCreated);
        return fileDate >= start && fileDate <= end;
      });
    }
    
    if (filters.fileType) {
      filteredFiles = filteredFiles.filter(file => 
        file.contentType?.includes(filters.fileType)
      );
    }
    
    if (filters.minSize || filters.maxSize) {
      filteredFiles = filteredFiles.filter(file => {
        if (filters.minSize && file.size < filters.minSize) return false;
        if (filters.maxSize && file.size > filters.maxSize) return false;
        return true;
      });
    }
    
    // Convert data URLs to blob URLs for downloads
    const processedFiles = filteredFiles.map(file => ({
      ...file,
      downloadURL: createBlobURL(file.data, file.contentType),
      // Remove data from response to save memory
      data: undefined
    }));
    
    console.log('✅ Found local files:', processedFiles.length);
    return processedFiles.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
    
  } catch (error) {
    console.error('❌ Error fetching local files:', error);
    return [];
  }
};

/**
 * Create blob URL from base64 data
 * @param {string} dataURL - Base64 data URL
 * @param {string} contentType - MIME type
 * @returns {string} Blob URL
 */
const createBlobURL = (dataURL, contentType) => {
  try {
    const byteString = atob(dataURL.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([arrayBuffer], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL:', error);
    return '';
  }
};

// ==================== FILE MANAGEMENT FUNCTIONS ====================

/**
 * Delete a file from local storage
 * @param {string} fileId - File ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteSubmissionFile = async (fileId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ File deleted successfully:', fileId);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

/**
 * Get storage statistics
 * @returns {Promise<Object>} Storage statistics
 */
export const getStorageStats = async () => {
  try {
    const files = await getAllSubmissionFiles();
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((total, file) => total + file.size, 0),
      fileTypes: {},
      testTypes: {},
      userCounts: {},
      dailyUploads: {}
    };
    
    files.forEach(file => {
      // File types
      const fileType = file.contentType?.split('/')[0] || 'unknown';
      stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1;
      
      // Test types
      stats.testTypes[file.testType] = (stats.testTypes[file.testType] || 0) + 1;
      
      // User counts
      stats.userCounts[file.userId] = (stats.userCounts[file.userId] || 0) + 1;
      
      // Daily uploads
      const date = file.timeCreated.split('T')[0];
      stats.dailyUploads[date] = (stats.dailyUploads[date] || 0) + 1;
    });
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      testTypes: {},
      userCounts: {},
      dailyUploads: {},
      error: error.message
    };
  }
};

// ==================== DIAGNOSTIC FUNCTIONS ====================

/**
 * Test local storage configuration
 * @returns {Promise<Object>} Diagnostic results
 */
export const testStorageConfiguration = async () => {
  console.log('🔍 Running local storage diagnostics...');
  
  const results = {
    configured: false,
    accessible: false,
    bucketExists: true, // Always true for local storage
    rulesConfigured: true, // No rules needed for local storage
    errors: [],
    recommendations: [],
    storageType: 'Local IndexedDB'
  };
  
  try {
    // Test IndexedDB availability
    if (!window.indexedDB) {
      results.errors.push('IndexedDB not supported in this browser');
      results.recommendations.push('Use a modern browser that supports IndexedDB');
      return results;
    }
    
    results.configured = true;
    console.log('✅ IndexedDB supported');
    
    // Test database access
    const db = await initDB();
    results.accessible = true;
    console.log('✅ Local storage accessible');
    
    // Test write access
    const testFile = new Blob(['test'], { type: 'text/plain' });
    testFile.name = 'test.txt';
    
    await uploadSubmissionFile(testFile, 'test-user', 'test', 'test-submission');
    await deleteSubmissionFile('test-user_test_test-submission_test.txt');
    
    console.log('✅ Local storage working perfectly');
    
  } catch (error) {
    results.errors.push('Local storage test failed: ' + error.message);
    results.recommendations.push('Check browser permissions and storage quota');
  }
  
  return results;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear all local storage data (use with caution!)
 * @returns {Promise<boolean>} Success status
 */
export const clearAllLocalStorage = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ All local storage cleared');
    return true;
    
  } catch (error) {
    console.error('❌ Error clearing local storage:', error);
    return false;
  }
};

/**
 * Export local storage data as JSON
 * @returns {Promise<string>} JSON string of all data
 */
export const exportLocalStorageData = async () => {
  try {
    const files = await getAllSubmissionFiles();
    return JSON.stringify(files, null, 2);
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    return '[]';
  }
};
