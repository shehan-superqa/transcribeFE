# VoiceScribe - Frontend

A modern React-based frontend application for voice transcription services. Transform audio and video files into accurate text transcriptions. Supports multiple engines, batch processing of audio/video files, live microphone transcription, and custom model training.

## Features

- **File Transcription**: Upload audio or video files for transcription with multiple processing modes
- **Video Support**: Transcribe video files by extracting and processing audio tracks
- **Batch Processing**: Process multiple audio/video files simultaneously
- **Live Microphone Transcription**: Real-time transcription with VAD (Voice Activity Detection)
- **Custom Model Training**: Train custom language models for specialized use cases
- **Transcription History**: View, search, filter, and download past transcriptions
- **User Settings**: Configure audio settings, output directories, and API keys
- **JWT Authentication**: Secure user authentication with automatic token refresh

## Prerequisites

- Node.js 18+ and npm/yarn
- Backend API services running (see configuration below)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd transcribeFE
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# User Authentication API (required)
VITE_API_BASE_URL=http://localhost:5003

# Transcription API (required)
VITE_TRANSCRIBE_API_BASE_URL=http://localhost:5000

# Optional: YouTube Proxy URL (if using YouTube conversion)
VITE_YOUTUBE_PROXY_URL=/api/youtube/stream
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Building for Production

Build the application:
```bash
npm run build
```

The production build will be in the `dist` directory.

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── transcription/  # Transcription-related components
│   └── ...
├── contexts/           # React contexts (notifications, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Library code and API clients
│   ├── api/           # API client functions
│   └── ...
├── pages/             # Page components
├── stores/            # Zustand stores
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | User authentication API base URL | Yes | `http://localhost:5003` |
| `VITE_TRANSCRIBE_API_BASE_URL` | Transcription API base URL | Yes | `http://localhost:5000` |
| `VITE_YOUTUBE_PROXY_URL` | YouTube proxy endpoint | No | `/api/youtube/stream` |

## API Integration

### Authentication API

The frontend integrates with a JWT-based authentication API. Required endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/users/settings` - Get user settings
- `POST /api/users/settings` - Save user settings
- `GET /api/subscription/plans` - Get subscription plans

### Transcription API

The frontend integrates with a transcription API. Required endpoints:

- `POST /api/transcribe` - Submit transcription job
- `POST /api/transcribe/batch` - Batch transcription
- `GET /api/jobs/:userId` - Get user jobs
- `GET /api/jobs/:jobId/status` - Get job status
- `POST /api/jobs/:jobId/cancel` - Cancel job
- `GET /api/models` - Get available models
- `POST /api/train` - Start model training
- `GET /api/train/:trainingId` - Get training status
- `POST /api/train/:trainingId/cancel` - Cancel training

## Key Features Implementation

### Transcription Modes

- **Batch Processing**: Process entire audio/video file at once
- **Parallel Streaming**: Process all 5s chunks simultaneously
- **Real-time Streaming**: Process 5s chunks with 5s delays
- **Advanced Streaming**: Research-grade with Local Agreement Policy
- **VAD-Enhanced Streaming**: With Voice Activity Detection

### Supported File Types

- **Audio**: MP3, WAV, M4A, FLAC, OGG, and more
- **Video**: MP4, AVI, MOV, MKV, and more (audio track extracted automatically)

### Supported Engines

- Whisper (OpenAI)
- Google Speech-to-Text
- OpenAI Whisper API
- Replicate

### Authentication

- JWT-based authentication with access and refresh tokens
- Automatic token refresh before expiration (5-minute buffer)
- Token stored in localStorage
- Automatic logout on token expiration

## Development Workflow

1. **Start Backend Services**: Ensure both authentication and transcription APIs are running
2. **Start Frontend**: Run `npm run dev`
3. **Development**: Make changes and see hot-reload updates
4. **Testing**: Test features with the running backend
5. **Build**: Run `npm run build` before deployment

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Hosting

The `dist` directory contains static files that can be deployed to:

- **Vercel**: Connect your repository and deploy
- **Netlify**: Drag and drop the `dist` folder or connect repository
- **GitHub Pages**: Use GitHub Actions to deploy
- **AWS S3 + CloudFront**: Upload `dist` contents to S3 bucket
- **Any static hosting service**: Upload `dist` contents

### Environment Variables in Production

Set environment variables in your hosting platform:

- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- AWS: Use CloudFormation or set in Lambda/ECS configuration

## Troubleshooting

### CORS Errors

Ensure backend APIs have CORS enabled for your frontend origin.

### Authentication Not Working

1. Verify `VITE_API_BASE_URL` is set correctly
2. Check backend API is running and accessible
3. Check browser console for errors
4. Verify token format in localStorage

### Transcription API Not Responding

1. Verify `VITE_TRANSCRIBE_API_BASE_URL` is set correctly
2. Check backend API is running
3. Verify authentication token is being sent
4. Check network tab for API request/response details

### Token Refresh Issues

- Tokens automatically refresh 5 minutes before expiration
- If refresh fails, user will be logged out
- Check browser console for refresh errors

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue in the repository or contact the development team.
