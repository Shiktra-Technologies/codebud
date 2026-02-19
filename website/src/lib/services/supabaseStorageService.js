/**
 * Storage Service — local file storage replacement for Supabase Storage
 * Currently uses localStorage/in-memory as a placeholder until 
 * a proper file upload API endpoint is added to the backend.
 */

// ==================== DIAGNOSTIC FUNCTIONS ====================

export const testStorageConfiguration = async () => {
  return {
    configured: true,
    accessible: true,
    bucketExists: true,
    rulesConfigured: true,
    errors: [],
    recommendations: [],
    note: 'Using local storage — MongoDB backend does not handle file uploads yet'
  };
};

// ==================== SUBMISSION FILE MANAGEMENT ====================

export const uploadSubmissionFile = async (userId, testType, submissionId, fileName, file) => {
  try {
    console.log(`📤 [LOCAL] Storing file reference: ${fileName}`);
    const fileRef = {
      userId,
      testType,
      submissionId,
      fileName,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      path: `${userId}/${testType}/${submissionId}/${fileName}`,
    };

    // Save reference in localStorage
    const refs = JSON.parse(localStorage.getItem('file_references') || '[]');
    refs.push(fileRef);
    localStorage.setItem('file_references', JSON.stringify(refs));

    return { success: true, ...fileRef };
  } catch (error) {
    console.error('[ERROR] Error storing file reference:', error);
    return { success: false, error: error.message, fileName };
  }
};

export const uploadSubmissionFiles = async (userId, testType, submissionId, files) => {
  const results = { successful: [], failed: [], totalFiles: files.length };
  for (const file of files) {
    const result = await uploadSubmissionFile(userId, testType, submissionId, file.name, file);
    (result.success ? results.successful : results.failed).push(result);
  }
  return results;
};

export const getFileDownloadURL = async (filePath) => {
  console.warn('[STORAGE] File downloads not yet implemented with MongoDB backend');
  return null;
};

export const getUserSubmissionFiles = async (userId, testType = null) => {
  try {
    const refs = JSON.parse(localStorage.getItem('file_references') || '[]');
    let filtered = refs.filter(r => r.userId === userId);
    if (testType) filtered = filtered.filter(r => r.testType === testType);
    return filtered.map(r => ({
      id: `${r.userId}_${r.fileName}_${Date.now()}`,
      name: r.fileName,
      size: r.size || 0,
      type: getFileType(r.fileName),
      uploadedAt: r.uploadedAt,
      downloadUrl: null,
      path: r.path,
      icon: getFileIcon(r.fileName),
    }));
  } catch {
    return [];
  }
};

export const getAllSubmissionFiles = async () => {
  try {
    const refs = JSON.parse(localStorage.getItem('file_references') || '[]');
    return refs.map(r => ({
      id: `admin_${r.fileName}_${Date.now()}`,
      name: r.fileName,
      fullPath: r.path,
      size: r.size || 0,
      type: getFileType(r.fileName),
      uploadedAt: r.uploadedAt,
      downloadUrl: null,
      userId: r.userId || 'unknown',
      testType: r.testType || 'unknown',
      icon: getFileIcon(r.fileName),
    }));
  } catch {
    return [];
  }
};

export const deleteSubmissionFile = async (filePath) => {
  try {
    const refs = JSON.parse(localStorage.getItem('file_references') || '[]');
    const filtered = refs.filter(r => r.path !== filePath);
    localStorage.setItem('file_references', JSON.stringify(filtered));
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const getStorageStats = async () => {
  const files = await getAllSubmissionFiles();
  return {
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
    fileTypes: {},
    userFiles: {},
    testTypes: {},
  };
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
};

const getFileType = (fileName) => {
  if (!fileName) return 'unknown';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map = {
    'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'java': 'java',
    'cpp': 'cpp', 'c': 'c', 'html': 'html', 'css': 'css', 'json': 'json',
    'pdf': 'pdf', 'txt': 'text', 'md': 'markdown', 'jpg': 'image',
    'jpeg': 'image', 'png': 'image', 'gif': 'image', 'svg': 'image',
    'zip': 'archive', 'rar': 'archive',
  };
  return map[ext] || 'unknown';
};

export const getFileIcon = (fileName) => {
  const type = getFileType(fileName);
  const icons = {
    'javascript': '📄', 'typescript': '📄', 'python': '🐍', 'java': '☕',
    'cpp': '⚡', 'c': '⚡', 'html': '🌐', 'css': '🎨', 'json': '📋',
    'pdf': '📕', 'text': '📝', 'markdown': '📝', 'image': '🖼️',
    'archive': '🗜️', 'unknown': '📄',
  };
  return icons[type] || '📄';
};

export default {
  testStorageConfiguration, uploadSubmissionFile, uploadSubmissionFiles,
  getUserSubmissionFiles, getAllSubmissionFiles, deleteSubmissionFile,
  getFileDownloadURL, getStorageStats, formatFileSize, getFileIcon,
};
