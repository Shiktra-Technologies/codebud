import React, { useState, useEffect } from 'react';
import { getSystemStatus } from '../utils/deviceOptimization';
import './DeviceCheck.css';

const DeviceCheck = ({ onContinue, onCancel }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkDevice = async () => {
      setLoading(true);
      const systemStatus = await getSystemStatus();
      setStatus(systemStatus);
      setLoading(false);
    };

    checkDevice();
  }, []);

  if (loading) {
    return (
      <div className="device-check-modal">
        <div className="device-check-content">
          <div className="device-check-loading">
            <div className="spinner"></div>
            <h2>Checking Device Capabilities...</h2>
            <p>Please wait while we verify your system</p>
          </div>
        </div>
      </div>
    );
  }

  const { capabilities, settings, requirements, score, fps, memory, status: deviceStatus, message } = status;

  return (
    <div className="device-check-modal">
      <div className="device-check-content">
        <div className="device-check-header">
          <h2>🖥️ Device Compatibility Check</h2>
          <p className="device-score">
            Performance Score: <span className={`score ${score >= 70 ? 'good' : score >= 50 ? 'moderate' : 'poor'}`}>
              {score}/100
            </span>
          </p>
        </div>

        <div className={`status-banner ${deviceStatus.ready ? 'success' : deviceStatus.warning ? 'warning' : 'error'}`}>
          <span className="status-icon">
            {deviceStatus.ready ? '✅' : deviceStatus.warning ? '⚠️' : '❌'}
          </span>
          <span className="status-message">{message}</span>
        </div>

        <div className="requirements-grid">
          <div className={`requirement-item ${requirements.memory ? 'met' : 'not-met'}`}>
            <span className="req-icon">{requirements.memory ? '✅' : '❌'}</span>
            <div className="req-details">
              <strong>Memory</strong>
              <p>{capabilities.memory} GB RAM {requirements.memory ? '(Sufficient)' : '(Minimum 2GB required)'}</p>
            </div>
          </div>

          <div className={`requirement-item ${requirements.cores ? 'met' : 'not-met'}`}>
            <span className="req-icon">{requirements.cores ? '✅' : '❌'}</span>
            <div className="req-details">
              <strong>Processor</strong>
              <p>{capabilities.cores} cores {requirements.cores ? '(Sufficient)' : '(Minimum 2 cores required)'}</p>
            </div>
          </div>

          <div className={`requirement-item ${requirements.network ? 'met' : 'not-met'}`}>
            <span className="req-icon">{requirements.network ? '✅' : '❌'}</span>
            <div className="req-details">
              <strong>Network</strong>
              <p>{capabilities.downlink} Mbps {requirements.network ? '(Sufficient)' : '(Minimum 1 Mbps required)'}</p>
            </div>
          </div>

          <div className={`requirement-item ${fps >= 30 ? 'met' : 'not-met'}`}>
            <span className="req-icon">{fps >= 30 ? '✅' : '❌'}</span>
            <div className="req-details">
              <strong>Graphics</strong>
              <p>{fps} FPS {fps >= 30 ? '(Smooth)' : '(May experience lag)'}</p>
            </div>
          </div>
        </div>

        {settings.recommendation && (
          <div className={`recommendation ${settings.warning ? 'warning' : 'info'}`}>
            <strong>Recommendation:</strong> {settings.recommendation}
          </div>
        )}

        <button 
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Hide Details' : '▼ Show Details'}
        </button>

        {showDetails && (
          <div className="device-details">
            <h3>System Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Device Type:</strong>
                <span>{capabilities.isMobile ? 'Mobile' : 'Desktop'}</span>
              </div>
              <div className="detail-item">
                <strong>Connection Type:</strong>
                <span>{capabilities.connectionType}</span>
              </div>
              <div className="detail-item">
                <strong>Latency:</strong>
                <span>{capabilities.rtt}ms</span>
              </div>
              {memory && (
                <div className="detail-item">
                  <strong>Memory Usage:</strong>
                  <span>{memory.used}MB / {memory.limit}MB ({memory.percentage}%)</span>
                </div>
              )}
            </div>

            <h3>Optimized Settings</h3>
            <div className="settings-info">
              <p>• Face Detection: Every {settings.proctoring.faceDetectionInterval / 1000}s</p>
              <p>• Object Detection: Every {settings.proctoring.objectDetectionInterval / 1000}s</p>
              <p>• Audio Analysis: {settings.proctoring.enableAudioAnalysis ? 'Enabled' : 'Disabled'}</p>
              <p>• Auto-Save: Every {settings.autoSave.interval / 1000}s</p>
              <p>• Video Quality: {settings.proctoring.videoQuality}</p>
            </div>
          </div>
        )}

        <div className="device-check-actions">
          {onCancel && (
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button 
            className={`btn-continue ${!deviceStatus.ready && !deviceStatus.warning ? 'btn-disabled' : ''}`}
            onClick={onContinue}
            disabled={deviceStatus.error}
          >
            {deviceStatus.ready ? 'Continue to Test' : deviceStatus.warning ? 'Continue Anyway' : 'Cannot Continue'}
          </button>
        </div>

        {!deviceStatus.ready && (
          <div className="warning-footer">
            <p>⚠️ <strong>Note:</strong> Your device may not provide optimal performance. Consider using a more powerful device for the best experience.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCheck;
