import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Video from '../models/Video.model.js';
import jwt from 'jsonwebtoken';

// Note: These tests require a running MongoDB instance and server
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-app-test';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Video API', () => {
  let app;
  let authToken;
  let testUser;

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_DB_URI);
      
      // Create test user
      testUser = await User.findOneAndUpdate(
        { email: 'videotest@example.com' },
        {
          username: 'videotestuser',
          email: 'videotest@example.com',
          password: 'hashedpassword',
          role: 'editor',
          organization: 'test-org'
        },
        { upsert: true, new: true }
      );

      // Generate auth token
      authToken = jwt.sign({ id: testUser._id }, JWT_SECRET, { expiresIn: '1h' });

      // Import server
      const { default: server } = await import('../server.js');
      app = server;
    } catch (error) {
      console.warn('Test setup warning:', error.message);
      console.warn('Tests require a running server. Skipping integration tests.');
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Video.deleteMany({ organization: 'test-org' });
      await mongoose.connection.close();
    }
  });

  describe('GET /api/videos', () => {
    it('should return videos for authenticated user', async () => {
      const response = await request(app)
        .get('/api/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('videos');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter videos by status', async () => {
      const response = await request(app)
        .get('/api/videos?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // All returned videos should have status 'completed'
      response.body.data.videos.forEach(video => {
        expect(video.status).toBe('completed');
      });
    });

    it('should filter videos by sensitivity status', async () => {
      const response = await request(app)
        .get('/api/videos?sensitivityStatus=safe')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.videos.forEach(video => {
        expect(video.sensitivityStatus).toBe('safe');
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/videos')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return a single video', async () => {
      // Create a test video
      const testVideo = await Video.create({
        filename: 'test-video.mp4',
        originalName: 'test-video.mp4',
        path: 'uploads/videos/test-video.mp4',
        mimeType: 'video/mp4',
        size: 1024,
        uploadedBy: testUser._id,
        organization: 'test-org',
        status: 'completed'
      });

      const response = await request(app)
        .get(`/api/videos/${testVideo._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.video).toHaveProperty('_id');
      expect(response.body.data.video.filename).toBe('test-video.mp4');

      // Cleanup
      await Video.findByIdAndDelete(testVideo._id);
    });

    it('should return 404 for non-existent video', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/videos/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

