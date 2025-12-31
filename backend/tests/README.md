# Testing Guide

Test files for the backend API. I'm using Jest for testing with Supertest for API endpoint testing.

## Running Tests

### Install Dependencies

First, ensure test dependencies are installed:

```bash
cd backend
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Test Structure

### Test Files

- `auth.test.js` - Authentication endpoint tests (register, login)
- `video.test.js` - Video API endpoint tests (CRUD operations, filtering)
- `utils.test.js` - Utility function tests

## Prerequisites

### MongoDB Connection

Tests require a MongoDB connection. You can use:

1. **Local MongoDB**: Ensure MongoDB is running locally
2. **MongoDB Atlas**: Update `MONGODB_URI` in environment variables
3. **Test Database**: Tests use a separate test database to avoid conflicts

### Environment Variables

Set the following environment variables for testing:

```env
MONGODB_URI=mongodb://localhost:27017/video-app-test
JWT_SECRET=test-secret-key
NODE_ENV=test
```

## Test Coverage

Current test coverage includes:

- ✅ User registration and validation
- ✅ User login and authentication
- ✅ Video listing with filters
- ✅ Video retrieval by ID
- ✅ Middleware function exports
- ✅ Utility function exports

## Writing New Tests

### Example Test Structure

```javascript
import { describe, it, expect } from '@jest/globals';

describe('Feature Name', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### API Endpoint Testing

```javascript
import request from 'supertest';

describe('GET /api/videos', () => {
  it('should return videos', async () => {
    const response = await request(app)
      .get('/api/videos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

## Notes

- Tests are configured to use ES modules (`type: "module"` in package.json)
- Some tests may require the server to be running (integration tests)
- Unit tests should be isolated and not require external services
- Always clean up test data after tests run

## CI/CD Integration

To integrate tests into CI/CD pipeline:

```bash
# Set test environment
export NODE_ENV=test
export MONGODB_URI=mongodb://localhost:27017/video-app-test

# Run tests
npm test
```

## Troubleshooting

### Tests Fail with Module Import Errors

- Ensure `NODE_OPTIONS=--experimental-vm-modules` is set
- Check that `jest.config.js` is properly configured
- Verify all dependencies are installed

### MongoDB Connection Errors

- Ensure MongoDB is running
- Check `MONGODB_URI` is correct
- Verify network access for MongoDB Atlas

### Test Timeout Errors

- Increase timeout in test file: `jest.setTimeout(10000)`
- Check for hanging connections or async operations

