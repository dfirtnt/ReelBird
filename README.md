# ReelBird - AI-Powered Bird Recognition in Videos

ReelBird is an application that identifies birds within user-uploaded videos by automatically processing large video files, splitting them into frame snapshots, and analyzing them with AI models specialized in bird recognition.

## Features

- **User Authentication**: Secure account creation and login
- **Video Upload**: Support for large video files (up to 20MB) with chunked uploads
- **Frame Extraction**: Automatic video processing at 10 FPS intervals
- **AI Detection**: Bird recognition using computer vision models
- **Detection Reports**: View detected birds with timestamps and confidence scores

## Architecture

- **Frontend**: React-based web application
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL for user data and detection results
- **AI Processing**: Python service with ONNX/PyTorch for bird recognition
- **Queue System**: Redis for job queuing and processing coordination
- **File Storage**: Local filesystem for video files and temporary snapshots

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Running with Docker Compose

1. Clone the repository:
```bash
git clone https://github.com/dfirtnt/ReelBird.git
cd ReelBird
```

2. Start all services:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec api npm run migrate
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- tusd (file uploads): http://localhost:1080

### Local Development

1. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# AI Worker
cd ../ai-worker
pip install -r requirements.txt
```

2. Start services individually:
```bash
# Database and Redis
docker-compose up -d db redis

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start

# AI Worker
cd ai-worker
python worker.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Videos
- `GET /api/videos` - Get user's videos
- `POST /api/videos` - Create video record
- `GET /api/videos/:id` - Get specific video
- `PATCH /api/videos/:id/status` - Update video status

### Detections
- `GET /api/detections/video/:videoId` - Get detections for video
- `GET /api/detections/video/:videoId/summary` - Get detection summary

## Configuration

Environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `UPLOAD_DIR` - Directory for uploaded videos
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 20MB)

## Development

### Database Schema

- **users**: User accounts and authentication
- **videos**: Video metadata and processing status
- **detections**: Bird detection results with timestamps

### AI Model

The AI worker currently uses a placeholder model for bird detection. In production, this would be replaced with:

- Pre-trained YOLO model for object detection
- ResNet-based model for bird species classification
- Custom model trained on bird datasets

### File Processing

- Videos are processed at 10 FPS intervals
- Frames are extracted using FFmpeg
- Temporary files are automatically cleaned up after processing

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
