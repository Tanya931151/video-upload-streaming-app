import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    flagged: 0
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [videosResponse] = await Promise.all([
        axios.get('/api/videos?limit=5&sortBy=createdAt&sortOrder=desc')
      ]);

      const videos = videosResponse.data.data.videos;
      setRecentVideos(videos);

      // Calculate stats
      const total = videosResponse.data.data.pagination.total;
      const processing = videos.filter(v => v.status === 'processing' || v.status === 'uploading').length;
      const completed = videos.filter(v => v.status === 'completed').length;
      const flagged = videos.filter(v => v.sensitivityStatus === 'flagged').length;

      setStats({ total, processing, completed, flagged });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.username}!</p>
      </div>

      <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="card">
          <h3>Total Videos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
            {stats.total}
          </p>
        </div>
        <div className="card">
          <h3>Processing</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
            {stats.processing}
          </p>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
            {stats.completed}
          </p>
        </div>
        <div className="card">
          <h3>Flagged</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
            {stats.flagged}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Recent Videos</h2>
          <Link to="/videos" className="btn btn-primary">
            View All
          </Link>
        </div>

        {recentVideos.length === 0 ? (
          <p>No videos uploaded yet.</p>
        ) : (
          <div className="video-grid">
            {recentVideos.map((video) => (
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
                  </div>
                  <div className="video-card-status">
                    <span className={`status-badge status-${video.status}`}>
                      {video.status}
                    </span>
                    <span className={`status-badge sensitivity-${video.sensitivityStatus}`}>
                      {video.sensitivityStatus}
                    </span>
                  </div>
                  {video.status === 'completed' && (
                    <Link
                      to={`/video/${video._id}`}
                      className="btn btn-primary"
                      style={{ marginTop: '10px', width: '100%', textAlign: 'center' }}
                    >
                      Watch
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

