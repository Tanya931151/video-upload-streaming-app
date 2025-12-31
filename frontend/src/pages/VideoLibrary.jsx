import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const VideoLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sensitivityStatus: '',
    dateFrom: '',
    dateTo: '',
    minSize: '',
    maxSize: '',
    minDuration: '',
    maxDuration: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({});
  const socket = useSocket();

  useEffect(() => {
    fetchVideos();
  }, [filters]);

  useEffect(() => {
    if (!socket) return;

    const handleVideoProgress = (data) => {
      // Update video in list if it's being processed
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video._id === data.videoId
            ? {
                ...video,
                processingProgress: data.progress,
                status: data.status,
                sensitivityStatus: data.sensitivityStatus || video.sensitivityStatus
              }
            : video
        )
      );
    };

    socket.on('video-progress', handleVideoProgress);

    return () => {
      socket.off('video-progress', handleVideoProgress);
    };
  }, [socket]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.sensitivityStatus) params.append('sensitivityStatus', filters.sensitivityStatus);
      
      // Advanced filters
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minSize) params.append('minSize', filters.minSize);
      if (filters.maxSize) params.append('maxSize', filters.maxSize);
      if (filters.minDuration) params.append('minDuration', filters.minDuration);
      if (filters.maxDuration) params.append('maxDuration', filters.maxDuration);
      
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await axios.get(`/api/videos?${params.toString()}`);
      setVideos(response.data.data.videos);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const clearAdvancedFilters = () => {
    setFilters({
      ...filters,
      dateFrom: '',
      dateTo: '',
      minSize: '',
      maxSize: '',
      minDuration: '',
      maxDuration: '',
      page: 1
    });
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await axios.delete(`/api/videos/${videoId}`);
      fetchVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video');
    }
  };

  if (loading && videos.length === 0) {
    return (
      <div className="page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Video Library</h1>
        <p className="page-subtitle">Manage and view all your videos</p>
      </div>

      <div className="filters">
        <div className="filters-grid">
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="uploading">Uploading</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sensitivity Status</label>
            <select
              value={filters.sensitivityStatus}
              onChange={(e) => handleFilterChange('sensitivityStatus', e.target.value)}
            >
              <option value="">All</option>
              <option value="safe">Safe</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ marginBottom: '10px' }}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="card" style={{ marginTop: '15px', padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Advanced Filters</h3>
            <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-group">
                <label>Upload Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Upload Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Min File Size (MB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={filters.minSize ? (filters.minSize / (1024 * 1024)).toFixed(1) : ''}
                  onChange={(e) => {
                    const value = e.target.value ? Math.round(parseFloat(e.target.value) * 1024 * 1024) : '';
                    handleFilterChange('minSize', value);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Max File Size (MB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={filters.maxSize ? (filters.maxSize / (1024 * 1024)).toFixed(1) : ''}
                  onChange={(e) => {
                    const value = e.target.value ? Math.round(parseFloat(e.target.value) * 1024 * 1024) : '';
                    handleFilterChange('maxSize', value);
                  }}
                  placeholder="500"
                />
              </div>
              <div className="form-group">
                <label>Min Duration (seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minDuration}
                  onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Max Duration (seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxDuration}
                  onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                  placeholder="300"
                />
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={clearAdvancedFilters}
              style={{ marginTop: '15px' }}
            >
              Clear Advanced Filters
            </button>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="card">
          <p>No videos found. Upload your first video to get started!</p>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((video) => (
              <div key={video._id} className="video-card">
                <div className="video-card-header">
                  <div style={{ color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem' }}>🎬</div>
                    <div>Video</div>
                  </div>
                </div>
                <div className="video-card-body">
                  <h3 className="video-card-title">{video.originalName}</h3>
                  <div className="video-card-meta">
                    <div>Size: {(video.size / (1024 * 1024)).toFixed(2)} MB</div>
                    <div>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</div>
                    {video.uploadedBy && (
                      <div>By: {video.uploadedBy.username}</div>
                    )}
                  </div>
                  <div className="video-card-status">
                    <span className={`status-badge status-${video.status}`}>
                      {video.status}
                    </span>
                    <span className={`status-badge sensitivity-${video.sensitivityStatus}`}>
                      {video.sensitivityStatus}
                    </span>
                  </div>
                  {(video.status === 'processing' || video.status === 'uploading') && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${video.processingProgress || 0}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {video.processingProgress || 0}%
                      </div>
                    </div>
                  )}
                  {video.status === 'completed' && (
                    <Link
                      to={`/video/${video._id}`}
                      className="btn btn-primary"
                      style={{ marginTop: '10px', width: '100%', textAlign: 'center', display: 'block' }}
                    >
                      Watch
                    </Link>
                  )}
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(video._id)}
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                Page {filters.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoLibrary;

