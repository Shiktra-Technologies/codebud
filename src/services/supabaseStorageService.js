import { supabase } from '../config/supabaseConfig';

/**
 * Supabase Storage Service for handling submission files
 * Organizes files by user, test type, and submission date
 */

// Storage bucket name - you'll need to create this in Supabase
const STORAGE_BUCKET = 'submissions';

// ==================== DIAGNOSTIC FUNCTIONS ====================

/**
 * Test Supabase Storage configuration and connectivity
 * @returns {Promise<Object>} Diagnostic results
 */
export const testStorageConfiguration = async () => {
  console.log('🔍 Running Supabase Storage diagnostics...');
  
  const results = {
    configured: false,
    accessible: false,
    bucketExists: false,
    rulesConfigured: false,
    errors: [],
    recommendations: []
  };
  
  try {
    // Test 1: Check if supabase is initialized
    if (!supabase) {
      results.errors.push('Supabase Storage not initialized');
      results.recommendations.push('Check Supabase configuration in config.js');
      return results;
    }
    results.configured = true;

    // Test 2: Check if bucket exists
    try {
      const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
      
      if (error) {
        if (error.message.includes('not found')) {
          results.errors.push(`Storage bucket '${STORAGE_BUCKET}' does not exist`);
          results.recommendations.push(`Create bucket '${STORAGE_BUCKET}' in Supabase Storage`);
        } else {
          results.errors.push('Storage bucket access error: ' + error.message);
        }
      } else {
        results.bucketExists = true;
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        results.errors.push(`Storage bucket '${STORAGE_BUCKET}' does not exist`);
        results.recommendations.push(`Create bucket '${STORAGE_BUCKET}' in Supabase Storage`);
      } else {
        results.errors.push('Storage bucket access error: ' + error.message);
      }
    }

    // Test 3: Try to list files (test accessibility)
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('test', { limit: 1 });

      if (error) {
        if (error.message.includes('not found')) {
          results.errors.push('Storage bucket not found');
          results.recommendations.push(`Create bucket '${STORAGE_BUCKET}' in Supabase Storage`);
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          results.errors.push('Storage access denied');
          results.recommendations.push('Configure Supabase Storage policies to allow authenticated access');
        } else {
          results.errors.push('Storage access error: ' + error.message);
        }
      } else {
        results.accessible = true;
        results.rulesConfigured = true;
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        results.errors.push('Storage bucket not found');
        results.recommendations.push(`Create bucket '${STORAGE_BUCKET}' in Supabase Storage`);
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        results.errors.push('Storage access denied');
        results.recommendations.push('Configure Supabase Storage policies to allow authenticated access');
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
 * Upload a submission file to Supabase Storage
 * @param {string} userId - User ID
 * @param {string} testType - Type of test (dsa, aptitude, etc.)
 * @param {string} submissionId - Submission ID
 * @param {string} fileName - Name of the file
 * @param {File|Blob} file - File to upload
 * @returns {Promise<Object>} Upload result
 */
export const uploadSubmissionFile = async (userId, testType, submissionId, fileName, file) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const filePath = `${userId}/${testType}/${today}/${submissionId}/${fileName}`;

    console.log(`📤 Uploading file: ${fileName} to path: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    console.log('[SUCCESS] File uploaded successfully:', fileName);
    return {
      success: true,
      path: data.path,
      fullPath: data.fullPath,
      fileName: fileName,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[ERROR] Error uploading file:', error);
    return {
      success: false,
      error: error.message,
      fileName: fileName
    };
  }
};

/**
 * Upload multiple submission files
 * @param {string} userId - User ID
 * @param {string} testType - Type of test
 * @param {string} submissionId - Submission ID
 * @param {Array} files - Array of files to upload
 * @returns {Promise<Object>} Upload results
 */
export const uploadSubmissionFiles = async (userId, testType, submissionId, files) => {
  const results = {
    successful: [],
    failed: [],
    totalFiles: files.length
  };

  console.log(`📤 Uploading ${files.length} files for submission ${submissionId}`);

  for (const file of files) {
    const result = await uploadSubmissionFile(userId, testType, submissionId, file.name, file);
    
    if (result.success) {
      results.successful.push(result);
    } else {
      results.failed.push(result);
    }
  }

  console.log(`✅ Upload complete: ${results.successful.length} successful, ${results.failed.length} failed`);
  return results;
};

/**
 * Get download URL for a file
 * @param {string} filePath - Path to the file in storage
 * @returns {Promise<string>} Download URL
 */
export const getFileDownloadURL = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600); // URL valid for 1 hour

    if (error) throw error;

    return data.signedUrl;
  } catch (error) {
    console.error('[ERROR] Error getting download URL:', error);
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
    let path = userId;
    if (testType) {
      path += `/${testType}`;
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(path, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    // Get detailed information for each file
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file) => {
        try {
          const fullPath = testType ? `${userId}/${testType}/${file.name}` : `${userId}/${file.name}`;
          const downloadUrl = await getFileDownloadURL(fullPath);
          
          return {
            id: `${userId}_${file.name}_${Date.now()}`,
            name: file.name,
            size: file.metadata?.size || 0,
            type: getFileType(file.name),
            uploadedAt: file.created_at,
            downloadUrl: downloadUrl,
            path: fullPath,
            icon: getFileIcon(file.name)
          };
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          return {
            id: `${userId}_${file.name}_${Date.now()}`,
            name: file.name,
            size: file.metadata?.size || 0,
            type: getFileType(file.name),
            uploadedAt: file.created_at,
            downloadUrl: null,
            path: testType ? `${userId}/${testType}/${file.name}` : `${userId}/${file.name}`,
            icon: getFileIcon(file.name),
            error: 'Failed to get download URL'
          };
        }
      })
    );

    console.log(`✅ Retrieved ${filesWithUrls.length} files for user ${userId}`);
    return filesWithUrls;
  } catch (error) {
    console.error('[ERROR] Error getting user submission files:', error);
    return [];
  }
};

/**
 * Get all submission files (for admin dashboard)
 * @returns {Promise<Array>} Array of all submission files
 */
export const getAllSubmissionFiles = async () => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    // Process files to get additional metadata
    const processedFiles = await Promise.all(
      (data || []).map(async (file) => {
        try {
          const downloadUrl = await getFileDownloadURL(file.name);
          const pathParts = file.name.split('/');
          
          return {
            id: `admin_${file.name}_${Date.now()}`,
            name: pathParts[pathParts.length - 1],
            fullPath: file.name,
            size: file.metadata?.size || 0,
            type: getFileType(file.name),
            uploadedAt: file.created_at,
            downloadUrl: downloadUrl,
            userId: pathParts[0] || 'unknown',
            testType: pathParts[1] || 'unknown',
            icon: getFileIcon(file.name)
          };
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          const pathParts = file.name.split('/');
          return {
            id: `admin_${file.name}_${Date.now()}`,
            name: pathParts[pathParts.length - 1],
            fullPath: file.name,
            size: file.metadata?.size || 0,
            type: getFileType(file.name),
            uploadedAt: file.created_at,
            downloadUrl: null,
            userId: pathParts[0] || 'unknown',
            testType: pathParts[1] || 'unknown',
            icon: getFileIcon(file.name),
            error: 'Failed to get download URL'
          };
        }
      })
    );

    console.log(`✅ Retrieved ${processedFiles.length} total submission files`);
    return processedFiles;
  } catch (error) {
    console.error('[ERROR] Error getting all submission files:', error);
    return [];
  }
};

/**
 * Delete a submission file
 * @param {string} filePath - Path to the file in storage
 * @returns {Promise<Object>} Deletion result
 */
export const deleteSubmissionFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) throw error;

    console.log('[SUCCESS] File deleted successfully:', filePath);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('[ERROR] Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get storage statistics
 * @returns {Promise<Object>} Storage stats
 */
export const getStorageStats = async () => {
  try {
    const allFiles = await getAllSubmissionFiles();
    
    const stats = {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, file) => sum + (file.size || 0), 0),
      fileTypes: {},
      userFiles: {},
      testTypes: {}
    };

    allFiles.forEach(file => {
      // Count by file type
      const type = file.type || 'unknown';
      stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
      
      // Count by user
      const userId = file.userId || 'unknown';
      stats.userFiles[userId] = (stats.userFiles[userId] || 0) + 1;
      
      // Count by test type
      const testType = file.testType || 'unknown';
      stats.testTypes[testType] = (stats.testTypes[testType] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('[ERROR] Error getting storage stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      userFiles: {},
      testTypes: {},
      error: error.message
    };
  }
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
};

/**
 * Get file type based on extension
 * @param {string} fileName - File name
 * @returns {string} File type
 */
const getFileType = (fileName) => {
  if (!fileName) return 'unknown';
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const typeMap = {
    // Code files
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'xml': 'xml',
    
    // Documents
    'pdf': 'pdf',
    'doc': 'document',
    'docx': 'document',
    'txt': 'text',
    'md': 'markdown',
    
    // Images
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    
    // Other
    'zip': 'archive',
    'rar': 'archive',
    '7z': 'archive'
  };
  
  return typeMap[extension] || 'unknown';
};

/**
 * Get file icon based on file type
 * @param {string} fileName - File name
 * @returns {string} Icon name/class
 */
export const getFileIcon = (fileName) => {
  const type = getFileType(fileName);
  
  const iconMap = {
    'javascript': '📄',
    'typescript': '📄',
    'python': '🐍',
    'java': '☕',
    'cpp': '⚡',
    'c': '⚡',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',
    'xml': '📋',
    'pdf': '📕',
    'document': '📄',
    'text': '📝',
    'markdown': '📝',
    'image': '🖼️',
    'archive': '🗜️',
    'unknown': '📄'
  };
  
  return iconMap[type] || '📄';
};

export default {
  testStorageConfiguration,
  uploadSubmissionFile,
  uploadSubmissionFiles,
  getUserSubmissionFiles,
  getAllSubmissionFiles,
  deleteSubmissionFile,
  getFileDownloadURL,
  getStorageStats,
  formatFileSize,
  getFileIcon
};
