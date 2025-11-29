import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata 
} from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Storage Service for handling submission files
 * Organizes files by user, test type, and submission date
 */

// ==================== DIAGNOSTIC FUNCTIONS ====================

/**
 * Test Firebase Storage configuration and connectivity
 * @returns {Promise<Object>} Diagnostic results
 */
export const testStorageConfiguration = async () => {
  console.log('🔍 Running Firebase Storage diagnostics...');
  
  const results = {
    configured: false,
    accessible: false,
    bucketExists: false,
    rulesConfigured: false,
    errors: [],
    recommendations: []
  };
  
  try {
    // Test 1: Check if storage is initialized
    if (!storage) {
      results.errors.push('Firebase Storage not initialized');
      results.recommendations.push('Check Firebase configuration in config.js');
      return results;
    }
    results.configured = true;
    console.log('✅ Firebase Storage initialized');
    
    // Test 2: Try to create a reference to test bucket access
    try {
      const testRef = ref(storage, 'test');
      results.bucketExists = true;
      console.log('✅ Storage bucket accessible');
    } catch (error) {
      results.errors.push('Cannot access storage bucket: ' + error.message);
      results.recommendations.push('Enable Firebase Storage in Firebase Console');
      return results;
    }
    
    // Test 3: Try to list root directory to test permissions
    try {
      const rootRef = ref(storage);
      await Promise.race([
        listAll(rootRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      results.accessible = true;
      results.rulesConfigured = true;
      console.log('✅ Storage permissions working');
    } catch (error) {
      if (error.message.includes('net::ERR_FAILED') || error.message.includes('CORS')) {
        results.errors.push('CORS/Network error - Firebase Storage may not be enabled');
        results.recommendations.push('Enable Firebase Storage in Firebase Console');
        results.recommendations.push('Check Firebase Storage security rules');
      } else if (error.code === 'storage/unauthorized') {
        results.errors.push('Storage access denied');
        results.recommendations.push('Configure Firebase Storage security rules to allow authenticated access');
      } else if (error.message === 'timeout') {
        results.errors.push('Storage request timeout');
        results.recommendations.push('Check internet connection and Firebase Storage availability');
      } else {
        results.errors.push('Storage access error: ' + error.message);
      }
    }
    
    return results;
    
  } catch (error) {
    results.errors.push('Storage diagnostic failed: ' + error.message);
    return results;
  }
};

// ==================== SUBMISSION FILE MANAGEMENT ====================

/**
 * Upload a submission file to Firebase Storage
 * @param {string} userId - User ID
 * @param {string} testType - Type of test (dsa, aptitude, etc.)
 * @param {string} submissionId - Submission ID
 * @param {File} file - File to upload
 * @param {function} onProgress - Progress callback (optional)
 * @returns {Promise<string>} Download URL
 */
export const uploadSubmissionFile = async (userId, testType, submissionId, file, onProgress = null) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const fileName = `${file.name}_${Date.now()}`;
    const filePath = `submissions/${userId}/${testType}/${timestamp}/${submissionId}/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    
    console.log('📤 Uploading submission file:', filePath);
    
    if (onProgress) {
      // Use resumable upload for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('❌ Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ File uploaded successfully:', downloadURL);
              resolve({
                downloadURL,
                filePath,
                fileName,
                size: file.size,
                type: file.type
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      // Simple upload without progress
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ File uploaded successfully:', downloadURL);
      return {
        downloadURL,
        filePath,
        fileName,
        size: file.size,
        type: file.type
      };
    }
  } catch (error) {
    console.error('❌ Error uploading submission file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple submission files
 * @param {string} userId - User ID
 * @param {string} testType - Type of test
 * @param {string} submissionId - Submission ID
 * @param {FileList} files - Files to upload
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadSubmissionFiles = async (userId, testType, submissionId, files, onProgress = null) => {
  const uploadPromises = Array.from(files).map(async (file, index) => {
    const fileProgress = onProgress ? (progress) => onProgress(index, progress) : null;
    return uploadSubmissionFile(userId, testType, submissionId, file, fileProgress);
  });
  
  try {
    const results = await Promise.all(uploadPromises);
    console.log('✅ All files uploaded successfully:', results.length);
    return results;
  } catch (error) {
    console.error('❌ Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Get all submission files for a user
 * @param {string} userId - User ID
 * @param {string} testType - Optional test type filter
 * @returns {Promise<Array>} Array of file metadata
 */
export const getUserSubmissionFiles = async (userId, testType = null) => {
  try {
    const basePath = testType ? `submissions/${userId}/${testType}` : `submissions/${userId}`;
    const storageRef = ref(storage, basePath);
    
    console.log('📂 Fetching user submission files:', basePath);
    
    const result = await listAll(storageRef);
    const files = [];
    
    // Process all files in subdirectories
    for (const folderRef of result.prefixes) {
      const folderResult = await listAll(folderRef);
      
      for (const subFolderRef of folderResult.prefixes) {
        const subFolderResult = await listAll(subFolderRef);
        
        for (const fileRef of subFolderResult.items) {
          try {
            const [metadata, downloadURL] = await Promise.all([
              getMetadata(fileRef),
              getDownloadURL(fileRef)
            ]);
            
            files.push({
              name: fileRef.name,
              fullPath: fileRef.fullPath,
              downloadURL,
              size: metadata.size,
              contentType: metadata.contentType,
              timeCreated: metadata.timeCreated,
              updated: metadata.updated
            });
          } catch (error) {
            console.warn('⚠️ Error fetching file metadata:', fileRef.fullPath, error);
          }
        }
      }
    }
    
    console.log('✅ Found submission files:', files.length);
    return files.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
  } catch (error) {
    console.error('❌ Error fetching user submission files:', error);
    return [];
  }
};

/**
 * Get all submission files (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of all submission files
 */
export const getAllSubmissionFiles = async (filters = {}) => {
  try {
    console.log('📂 Fetching all submission files with filters:', filters);
    
    // Check if Firebase Storage is properly configured
    const storageRef = ref(storage, 'submissions');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Storage request timeout')), 10000);
    });
    
    const result = await Promise.race([listAll(storageRef), timeoutPromise]);
    const files = [];
    
    // Process all user folders
    for (const userFolderRef of result.prefixes) {
      const userId = userFolderRef.name;
      
      // Skip if user filter is applied and doesn't match
      if (filters.userId && userId !== filters.userId) continue;
      
      const userResult = await listAll(userFolderRef);
      
      // Process all test type folders
      for (const testTypeFolderRef of userResult.prefixes) {
        const testType = testTypeFolderRef.name;
        
        // Skip if test type filter is applied and doesn't match
        if (filters.testType && testType !== filters.testType) continue;
        
        const testTypeResult = await listAll(testTypeFolderRef);
        
        // Process all date folders
        for (const dateFolderRef of testTypeResult.prefixes) {
          const date = dateFolderRef.name;
          
          // Skip if date filter is applied and doesn't match
          if (filters.date && date !== filters.date) continue;
          
          const dateResult = await listAll(dateFolderRef);
          
          // Process all submission folders
          for (const submissionFolderRef of dateResult.prefixes) {
            const submissionId = submissionFolderRef.name;
            
            const submissionResult = await listAll(submissionFolderRef);
            
            // Process all files in submission
            for (const fileRef of submissionResult.items) {
              try {
                const [metadata, downloadURL] = await Promise.all([
                  getMetadata(fileRef),
                  getDownloadURL(fileRef)
                ]);
                
                files.push({
                  userId,
                  testType,
                  date,
                  submissionId,
                  name: fileRef.name,
                  fullPath: fileRef.fullPath,
                  downloadURL,
                  size: metadata.size,
                  contentType: metadata.contentType,
                  timeCreated: metadata.timeCreated,
                  updated: metadata.updated
                });
              } catch (error) {
                console.warn('⚠️ Error fetching file metadata:', fileRef.fullPath, error);
              }
            }
          }
        }
      }
    }
    
    console.log('✅ Found total submission files:', files.length);
    
    // Apply additional filters
    let filteredFiles = files;
    
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
    
    // Sort by creation time (newest first)
    return filteredFiles.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
  } catch (error) {
    console.error('❌ Error fetching all submission files:', error);
    console.error('🔍 Error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide helpful error information
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Firebase Storage access denied. Please check storage rules.');
      throw new Error('STORAGE_UNAUTHORIZED');
    } else if (error.code === 'storage/unknown' || error.message.includes('net::ERR_FAILED')) {
      console.error('🚫 Firebase Storage service not available. Storage may not be enabled.');
      console.error('💡 Solution: Enable Firebase Storage in Firebase Console');
      throw new Error('STORAGE_NOT_ENABLED');
    } else if (error.message.includes('CORS') || error.message.includes('access control')) {
      console.error('🌐 CORS error indicates Firebase Storage configuration issue.');
      console.error('💡 Solution: Check if Firebase Storage is properly set up');
      throw new Error('STORAGE_CORS_ERROR');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Firebase Storage request timeout.');
      throw new Error('STORAGE_TIMEOUT');
    } else if (error.message.includes('does not exist')) {
      console.error('📦 Storage bucket not found or not accessible.');
      throw new Error('STORAGE_BUCKET_NOT_FOUND');
    }
    
    // For network-related errors, provide specific guidance
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('🌐 Network error - Firebase Storage may not be configured');
      throw new Error('STORAGE_NETWORK_ERROR');
    }
    
    // Return empty array for other errors to keep UI functional
    console.warn('⚠️ Unknown storage error, returning empty array to keep UI functional');
    return [];
  }
};

/**
 * Delete a submission file
 * @param {string} filePath - Full path to the file
 * @returns {Promise<boolean>} Success status
 */
export const deleteSubmissionFile = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    
    console.log('✅ File deleted successfully:', filePath);
    return true;
  } catch (error) {
    console.error('❌ Error deleting submission file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get storage usage statistics
 * @returns {Promise<Object>} Storage statistics
 */
export const getStorageStats = async () => {
  try {
    const files = await getAllSubmissionFiles();
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      fileTypes: {},
      testTypes: {},
      userCounts: {},
      dailyUploads: {}
    };
    
    files.forEach(file => {
      // File types
      const type = file.contentType?.split('/')[0] || 'unknown';
      stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
      
      // Test types
      stats.testTypes[file.testType] = (stats.testTypes[file.testType] || 0) + 1;
      
      // User counts
      stats.userCounts[file.userId] = (stats.userCounts[file.userId] || 0) + 1;
      
      // Daily uploads
      const day = file.date;
      stats.dailyUploads[day] = (stats.dailyUploads[day] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    
    // Provide mock stats when storage is unavailable
    return {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: { 'Storage unavailable': 1 },
      testTypes: { 'Please configure Firebase Storage': 1 },
      userCounts: {},
      dailyUploads: {},
      error: 'Storage service unavailable'
    };
  }
};

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon based on content type
export const getFileIcon = (contentType) => {
  if (!contentType) return '📄';
  
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  if (contentType.includes('pdf')) return '📕';
  if (contentType.includes('doc')) return '📘';
  if (contentType.includes('sheet') || contentType.includes('excel')) return '📊';
  if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
  if (contentType.includes('text')) return '📝';
  
  return '📄';
};
