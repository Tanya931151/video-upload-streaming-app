import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}`);
      setVideo(response.data.data.video);
    } catch (error) {
      setError('Failed to load video');
      console.error('Failed to fetch video:', error);
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

  if (error || !video) {
    return (
      <div className="page">
        <div className="alert alert-error">
          <h2>Error</h2>
          <p>{error || 'Video not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/videos')}>
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (video.status !== 'completed') {
    return (
      <div className="page">
        <div className="alert alert-info">
          <h2>Video Not Ready</h2>
          <p>This video is still being processed. Please check back later.</p>
          <button className="btn btn-primary" onClick={() => navigate('/videos')}>
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const videoUrl = `/api/videos/${id}/stream`;

  return (
    <div className="video-player-container">
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/videos')}
        style={{ marginBottom: '20px' }}
      >
        ← Back to Library
      </button>

      <div className="video-player-wrapper">
        <ReactPlayer
          url={videoUrl}
          controls
          width="100%"
          height="auto"
          playing={false}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
        />
      </div>

      <div className="video-info">
        <h2>{video.originalName}</h2>
        <div className="video-card-status" style={{ marginBottom: '15px' }}>
          <span className={`status-badge status-${video.status}`}>
            {video.status}
          </span>
          <span className={`status-badge sensitivity-${video.sensitivityStatus}`}>
            {video.sensitivityStatus}
          </span>
        </div>

        <div className="video-info-grid">
          <div className="video-info-item">
            <span className="video-info-label">File Size</span>
            <span className="video-info-value">
              {(video.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <div className="video-info-item">
            <span className="video-info-label">Duration</span>
            <span className="video-info-value">
              {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
            </span>
          </div>
          <div className="video-info-item">
            <span className="video-info-label">Upload Date</span>
            <span className="video-info-value">
              {new Date(video.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="video-info-item">
            <span className="video-info-label">Uploaded By</span>
            <span className="video-info-value">
              {video.uploadedBy?.username || 'Unknown'}
            </span>
          </div>
          {video.metadata && (
            <>
              {video.metadata.width && (
                <div className="video-info-item">
                  <span className="video-info-label">Resolution</span>
                  <span className="video-info-value">
                    {video.metadata.width}x{video.metadata.height}
                  </span>
                </div>
              )}
              {video.metadata.codec && (
                <div className="video-info-item">
                  <span className="video-info-label">Codec</span>
                  <span className="video-info-value">{video.metadata.codec}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

