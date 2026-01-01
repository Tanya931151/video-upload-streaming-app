# Video Upload, Sensitivity Processing, and Streaming Application

A full-stack video management application I built that allows users to upload videos, analyze them for content sensitivity, and stream videos with real-time processing updates. This was my assignment project focusing on building a complete video platform from scratch.

## Features

- **Full-Stack Architecture**: Node.js + Express + MongoDB (backend) and React + Vite (frontend)
- **Video Management**: Complete video upload and secure storage system
- **Content Analysis**: Process videos for sensitivity detection (safe/flagged classification)
- **Real-Time Updates**: Display live processing progress to users via Socket.io
- **Streaming Service**: Enable video playback using HTTP range requests
- **Access Control**: Multi-tenant architecture with role-based permissions (Viewer, Editor, Admin)
- **Advanced Filtering**: Filter videos by date range, file size, and duration
- **Testing**: Jest testing framework with test files for critical functionality
- **Responsive Design**: Cross-platform compatibility and intuitive user experience

## Demo

**Live Application**:
- Frontend: https://tanyaassignment.netlify.app/login
- Backend API: https://sincere-blessing-production.up.railway.app/


## Tech Stack

I chose these technologies based on what I'm comfortable with and what fits the requirements:

**Backend:**
- Node.js + Express - Simple and fast for APIs
- MongoDB + Mongoose - Flexible schema for video metadata
- Socket.io - Real-time updates for processing progress
- JWT - Stateless authentication
- Multer - Handles file uploads

**Frontend:**
- React + Vite - Fast development and good DX
- Context API - Simple state management (didn't need Redux for this)
- Axios - HTTP requests
- React Player - Video playback component

## Project Structure

```
pule_assignment/
├── backend/
│   ├── models/          # MongoDB models (User, Video)
│   ├── routes/          # API routes (auth, video, user)
│   ├── middleware/      # Authentication, error handling, multi-tenant
│   ├── utils/           # Upload configuration, video processing
│   ├── uploads/         # Video storage directory
│   ├── server.js        # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React Context (Auth, Socket)
│   │   ├── pages/       # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd pule_assignment
```

### Step 2: Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

Or install separately:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3: Environment Configuration

#### Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/video-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=500000000
UPLOAD_PATH=./uploads/videos
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg,video/quicktime

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

#### Frontend Configuration
The frontend is configured to proxy API requests to `http://localhost:5000` by default (see `vite.config.js`).

### Step 4: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### Step 5: Run the Application

#### Option 1: Run Both Servers Concurrently
```bash
npm run dev
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Usage

### 1. User Registration/Login
- Navigate to the registration page to create an account
- Choose a role: Viewer, Editor, or Admin
- Login with your credentials

### 2. Video Upload (Editor/Admin)
- Navigate to the Upload page
- Select or drag-and-drop a video file (MP4, WebM, OGG, QuickTime)
- Maximum file size: 500MB
- Monitor real-time upload and processing progress

### 3. Video Processing
- Videos are automatically processed after upload
- Real-time progress updates via Socket.io
- Sensitivity analysis determines if content is "safe" or "flagged"

### 4. Video Library
- View all uploaded videos
- Filter by status (uploading, processing, completed, failed)
- Filter by sensitivity status (safe, flagged, pending)
- Delete videos (Editor/Admin only)

### 5. Video Streaming
- Click "Watch" on completed videos
- Videos stream using HTTP range requests
- Full video player controls available

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "editor",
  "organization": "default"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current authenticated user (requires JWT token).

### Video Endpoints

#### POST `/api/videos/upload`
Upload a video file (Editor/Admin only).

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `video`: Video file

#### GET `/api/videos`
Get all videos with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (uploading, processing, completed, failed)
- `sensitivityStatus`: Filter by sensitivity (safe, flagged, pending)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (asc/desc, default: desc)
- `dateFrom`: Filter videos uploaded from this date (YYYY-MM-DD)
- `dateTo`: Filter videos uploaded until this date (YYYY-MM-DD)
- `minSize`: Minimum file size in bytes
- `maxSize`: Maximum file size in bytes
- `minDuration`: Minimum video duration in seconds
- `maxDuration`: Maximum video duration in seconds

#### GET `/api/videos/:id`
Get a single video by ID.

#### GET `/api/videos/:id/stream`
Stream video with HTTP range request support.

#### DELETE `/api/videos/:id`
Delete a video (Editor/Admin only).

## Role-Based Access Control

### Viewer Role
- View videos in their organization
- Stream completed videos
- Cannot upload or delete videos

### Editor Role
- All Viewer permissions
- Upload videos
- Delete their own videos
- View all videos in their organization

### Admin Role
- All Editor permissions
- Delete any video in their organization
- Manage users (future enhancement)

## Multi-Tenant Architecture

- Each user belongs to an organization
- Users can only access videos from their organization
- Data is automatically filtered by organization
- Secure data segregation at the database level

## Real-Time Features

- Socket.io integration for live updates
- Real-time processing progress tracking
- Automatic UI updates when video status changes
- Connection management and error handling

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Multi-tenant data isolation
- File type and size validation
- CORS configuration
- Secure file storage

## Error Handling

- Comprehensive error handling middleware
- User-friendly error messages
- Validation for all inputs
- Graceful error recovery

## Development

### Code Structure
- Modular architecture with separation of concerns
- Reusable components and utilities
- Clean code with proper comments
- Consistent naming conventions

### Testing
Basic testing structure is in place. For production, add:
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical workflows

## Deployment

### Backend Deployment
1. Set environment variables on hosting platform
2. Ensure MongoDB connection is configured
3. Set up file storage (local or cloud)
4. Configure CORS for frontend domain

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy `dist/` folder to hosting platform
3. Configure API proxy or update API URLs

### Recommended Platforms
- **Backend**: Heroku, Railway, Render, AWS
- **Frontend**: Netlify, Vercel, GitHub Pages
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3, Google Cloud Storage (for production)

## Future Enhancements

- Advanced video filtering and search
- Video compression and optimization
- CDN integration for streaming
- User assignment system for Viewers
- Email notifications
- Video thumbnails generation
- Advanced analytics and reporting
- Batch video upload
- Video editing capabilities

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env` file
   - Verify connection string format

2. **File Upload Fails**
   - Check file size (max 500MB)
   - Verify file type is allowed
   - Ensure `uploads/` directory exists and is writable

3. **Socket.io Connection Issues**
   - Check CORS configuration
   - Verify frontend URL in backend `.env`
   - Check browser console for errors

4. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure token is sent in Authorization header

## License

This project is created for assignment purposes.

## Contact

For questions or issues, please refer to the project documentation or contact the development team.

