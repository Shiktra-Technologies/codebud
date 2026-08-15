// This file has been migrated to supabaseStorageService.js
// Re-exporting functions for backward compatibility
export {
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
} from './supabaseStorageService';

export default {
  testStorageConfiguration: require('./supabaseStorageService').testStorageConfiguration,
  uploadSubmissionFile: require('./supabaseStorageService').uploadSubmissionFile,
  uploadSubmissionFiles: require('./supabaseStorageService').uploadSubmissionFiles,
  getUserSubmissionFiles: require('./supabaseStorageService').getUserSubmissionFiles,
  getAllSubmissionFiles: require('./supabaseStorageService').getAllSubmissionFiles,
  deleteSubmissionFile: require('./supabaseStorageService').deleteSubmissionFile,
  getFileDownloadURL: require('./supabaseStorageService').getFileDownloadURL,
  getStorageStats: require('./supabaseStorageService').getStorageStats,
  formatFileSize: require('./supabaseStorageService').formatFileSize,
  getFileIcon: require('./supabaseStorageService').getFileIcon
};
