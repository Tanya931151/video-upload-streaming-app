import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleVideoProgress = (data) => {
      if (data.videoId === currentVideoId) {
        setProcessingProgress(data.progress);
        setMessage(data.message || '');
        
        if (data.status === 'completed') {
          setMessage(`Processing complete! Status: ${data.sensitivityStatus}`);
          setTimeout(() => {
            navigate('/videos');
          }, 2000);
        } else if (data.status === 'failed') {
          setError(data.message || 'Processing failed');
          setUploading(false);
        }
      }
    };

    socket.on('video-progress', handleVideoProgress);

    return () => {
      socket.off('video-progress', handleVideoProgress);
    };
  }, [socket, currentVideoId, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please select a video file (MP4, WebM, OGG, or QuickTime).');
        return;
      }

      // Validate file size (500MB max)
      const maxSize = 500 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File size exceeds 500MB limit.');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (allowedTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Invalid file type. Please select a video file.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('Uploading video...');
    setUploadProgress(0);
    setProcessingProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setCurrentVideoId(response.data.data.video._id);
      setMessage('Upload complete! Processing video...');
      setUploadProgress(100);
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Upload Video</h1>
        <p className="page-subtitle">Upload and process videos for sensitivity analysis</p>
      </div>

      <div className="upload-form">
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-info">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div
            className="upload-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('video-input').click()}
          >
            <div className="upload-icon">📹</div>
            <p>
              {file ? file.name : 'Click or drag video file here'}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
              Supported formats: MP4, WebM, OGG, QuickTime (Max 500MB)
            </p>
            <input
              type="file"
              id="video-input"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="card">
              <h3>Selected File</h3>
              <p><strong>Name:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {file.type}</p>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">Upload: {uploadProgress}%</div>
            </div>
          )}

          {processingProgress > 0 && processingProgress < 100 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${processingProgress}%`, backgroundColor: '#17a2b8' }}
                ></div>
              </div>
              <div className="progress-text">Processing: {processingProgress}%</div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!file || uploading}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoUpload;

