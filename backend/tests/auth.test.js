import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/User.model.js';

// Note: These tests require a running MongoDB instance
// Set NODE_ENV=test to use a test database
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-app-test';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

describe('Authentication API', () => {
  let app;

  beforeAll(async () => {
    // Import server after setting up test environment
    if (process.env.NODE_ENV !== 'test') {
      process.env.NODE_ENV = 'test';
    }
    
    // Connect to test database
    try {
      await mongoose.connect(TEST_DB_URI);
      // Import server dynamically
      const { default: server } = await import('../server.js');
      app = server;
    } catch (error) {
      console.warn('Test setup warning:', error.message);
      console.warn('Tests require a running server. Skipping integration tests.');
    }
  });

  afterAll(async () => {
    // Clean up test database
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: /^test/ });
      await mongoose.connection.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'password123',
        role: 'editor',
        organization: 'test-org'
      };

      // Clean up if user exists
      await User.deleteOne({ email: userData.email });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('username', userData.username);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        username: 'testuser_unique',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'editor'
      };

      // Create user first
      await User.deleteOne({ email: userData.email });
      await request(app).post('/api/auth/register').send(userData);

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid password (too short)', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345', // Less than 6 characters
        role: 'editor'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        username: 'loginuser_' + Date.now(),
        email: 'login_' + Date.now() + '@example.com',
        password: 'password123',
        role: 'editor'
      };

      await User.deleteOne({ email: userData.email });
      await request(app).post('/api/auth/register').send(userData);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

