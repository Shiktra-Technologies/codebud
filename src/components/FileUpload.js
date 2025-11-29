import React, { useState } from 'react';
import { uploadSubmissionFile } from '../services/localStorageService';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess, testType = 'dsa', submissionId = 'manual-upload' }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { user } = useSimpleAuth();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const result = await uploadSubmissionFile(
          file, 
          user?.uid || 'anonymous', 
          testType, 
          submissionId
        );
        console.log('✅ File uploaded:', result);
        return result;
      } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      onUploadSuccess && onUploadSuccess(results);
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    handleFiles(files);
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`file-upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>📤 Uploading files...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📁</div>
            <h3>Drop files here or click to browse</h3>
            <p>Supports all file types • No size limits</p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="file-input"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="upload-button">
              Choose Files
            </label>
          </>
        )}
      </div>
      
      <div className="upload-info">
        <div className="info-item">
          <span className="info-label">📍 Storage:</span>
          <span className="info-value">Local Browser Storage (Free)</span>
        </div>
        <div className="info-item">
          <span className="info-label">🔒 Security:</span>
          <span className="info-value">Client-side only</span>
        </div>
        <div className="info-item">
          <span className="info-label">💾 Limit:</span>
          <span className="info-value">Based on browser storage quota</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
