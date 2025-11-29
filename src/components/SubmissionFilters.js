import React, { useState, useEffect } from 'react';
import './SubmissionFilters.css';

const SubmissionFilters = ({ onFiltersChange, totalCount = 0, filteredCount = 0 }) => {
  const [filters, setFilters] = useState({
    search: '',
    testType: '',
    status: '',
    dateRange: '',
    customDateStart: '',
    customDateEnd: '',
    userId: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc',
    fileType: '',
    minScore: '',
    maxScore: ''
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Predefined filter options
  const testTypes = [
    { value: '', label: 'All Test Types' },
    { value: 'dsa', label: 'DSA Problems' },
    { value: 'aptitude', label: 'Aptitude Tests' },
    { value: 'coding', label: 'Coding Challenges' },
    { value: 'quiz', label: 'Quizzes' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'flagged', label: 'Flagged' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const sortOptions = [
    { value: 'submittedAt', label: 'Submission Date' },
    { value: 'score', label: 'Score' },
    { value: 'duration', label: 'Duration' },
    { value: 'studentName', label: 'Student Name' },
    { value: 'testType', label: 'Test Type' }
  ];

  const fileTypeOptions = [
    { value: '', label: 'All Files' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documents' },
    { value: 'code', label: 'Code Files' },
    { value: 'archive', label: 'Archives' }
  ];

  // Update filters and notify parent
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle individual filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset custom date fields if switching away from custom range
    if (key === 'dateRange' && value !== 'custom') {
      newFilters.customDateStart = '';
      newFilters.customDateEnd = '';
    }
    
    updateFilters(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      testType: '',
      status: '',
      dateRange: '',
      customDateStart: '',
      customDateEnd: '',
      userId: '',
      sortBy: 'submittedAt',
      sortOrder: 'desc',
      fileType: '',
      minScore: '',
      maxScore: ''
    };
    updateFilters(clearedFilters);
  };

  // Quick filter presets
  const applyQuickFilter = (preset) => {
    const quickFilters = {
      recent: { dateRange: 'today', sortBy: 'submittedAt', sortOrder: 'desc' },
      passed: { status: 'passed', sortBy: 'score', sortOrder: 'desc' },
      failed: { status: 'failed', sortBy: 'submittedAt', sortOrder: 'desc' },
      flagged: { status: 'flagged', sortBy: 'submittedAt', sortOrder: 'desc' },
      highScores: { minScore: '80', sortBy: 'score', sortOrder: 'desc' }
    };
    
    if (quickFilters[preset]) {
      updateFilters({ ...filters, ...quickFilters[preset] });
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'sortBy' && key !== 'sortOrder' && value !== ''
  );

  return (
    <div className="submission-filters">
      {/* Filter Header */}
      <div className="filter-header">
        <div className="filter-title">
          <h3>🔍 Filter Submissions</h3>
          <div className="filter-count">
            {filteredCount !== totalCount ? (
              <span className="filtered-count">
                {filteredCount} of {totalCount} submissions
              </span>
            ) : (
              <span className="total-count">{totalCount} submissions</span>
            )}
          </div>
        </div>
        
        <div className="filter-actions">
          <button 
            className="advanced-toggle"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            {isAdvancedOpen ? '🔼 Hide Advanced' : '🔽 Show Advanced'}
          </button>
          
          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearAllFilters}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="quick-filters">
        <button 
          className="quick-filter-btn" 
          onClick={() => applyQuickFilter('recent')}
        >
          📅 Recent
        </button>
        <button 
          className="quick-filter-btn" 
          onClick={() => applyQuickFilter('passed')}
        >
          ✅ Passed
        </button>
        <button 
          className="quick-filter-btn" 
          onClick={() => applyQuickFilter('failed')}
        >
          ❌ Failed
        </button>
        <button 
          className="quick-filter-btn" 
          onClick={() => applyQuickFilter('flagged')}
        >
          🚩 Flagged
        </button>
        <button 
          className="quick-filter-btn" 
          onClick={() => applyQuickFilter('highScores')}
        >
          🏆 High Scores
        </button>
      </div>

      {/* Main Filters Row */}
      <div className="main-filters">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by student name, email, or submission ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Test Type</label>
          <select 
            value={filters.testType} 
            onChange={(e) => handleFilterChange('testType', e.target.value)}
          >
            {testTypes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <select 
            value={filters.dateRange} 
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <div className="sort-controls">
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className={`sort-order ${filters.sortOrder}`}
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {filters.sortOrder === 'asc' ? '🔼' : '🔽'}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {isAdvancedOpen && (
        <div className="advanced-filters">
          <div className="advanced-filters-grid">
            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <>
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.customDateStart}
                    onChange={(e) => handleFilterChange('customDateStart', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.customDateEnd}
                    onChange={(e) => handleFilterChange('customDateEnd', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Score Range */}
            <div className="filter-group">
              <label>Min Score</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Max Score</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="100"
                value={filters.maxScore}
                onChange={(e) => handleFilterChange('maxScore', e.target.value)}
              />
            </div>

            {/* File Type Filter */}
            <div className="filter-group">
              <label>File Type</label>
              <select 
                value={filters.fileType} 
                onChange={(e) => handleFilterChange('fileType', e.target.value)}
              >
                {fileTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific User ID */}
            <div className="filter-group">
              <label>User ID</label>
              <input
                type="text"
                placeholder="Filter by specific user ID..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          <div className="active-filters-tags">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'sortBy' || key === 'sortOrder') return null;
              
              let displayValue = value;
              if (key === 'testType') displayValue = testTypes.find(t => t.value === value)?.label || value;
              if (key === 'status') displayValue = statusOptions.find(s => s.value === value)?.label || value;
              if (key === 'dateRange') displayValue = dateRangeOptions.find(d => d.value === value)?.label || value;
              
              return (
                <span key={key} className="filter-tag">
                  {key}: {displayValue}
                  <button onClick={() => handleFilterChange(key, '')}>✕</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionFilters;
