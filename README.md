# ReelBird - AI-Powered Bird Detection in Videos

ReelBird is an intelligent video analysis system that automatically detects and identifies birds in user-uploaded videos using a two-stage AI pipeline.

## 🎯 Features

- **Two-Stage AI Pipeline**: Efficient binary bird detection followed by species identification
- **10 FPS Frame Extraction**: Automatic video processing with FFmpeg
- **Real-time Processing**: Redis-based queue system for scalable processing
- **Comprehensive Testing**: Playwright E2E testing with closed-loop debugging
- **Docker Deployment**: Containerized services for easy deployment

## 🏗️ Architecture

### Services
- **API Server**: Node.js/Express backend with video upload and processing endpoints
- **AI Worker**: Python service with EfficientNet models for bird detection
- **Database**: PostgreSQL for metadata storage
- **Queue**: Redis for job management and processing coordination
- **Frontend**: React-based web interface

### AI Pipeline
1. **Stage 1**: Binary classification (Bird Present vs No Bird) using EfficientNet-B0
2. **Stage 2**: Species identification (48 bird species) using EfficientNet-B3

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.8+ (for AI worker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ReelBird.git
   cd ReelBird
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec api npm run migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Health check: http://localhost:3001/health

## 📊 API Endpoints

### Video Management
- `POST /api/upload` - Upload video file
- `GET /api/videos` - List all videos
- `GET /api/videos/:id` - Get video details
- `PATCH /api/videos/:id/status` - Update video status

### Detection Results
- `GET /api/detections/video/:videoId` - Get detections for a video
- `GET /api/detections/video/:videoId/summary` - Get detection summary

## 🧪 Testing

### Run Tests
```bash
# Install Playwright browsers
docker-compose exec api npx playwright install --with-deps

# Run E2E tests
docker-compose exec api npm run test:e2e

# Run tests with debugging
docker-compose exec api npm run test:debug
```

### Test Results
- HTML reports: `backend/playwright-report/`
- Trace files: `backend/test-results/`
- Open reports: `npm run trace:open`

## 🔧 Development

### Local Development Setup
```bash
# Backend development
cd backend
npm install
npm run dev

# AI Worker development
cd ai-worker
pip install -r requirements.txt
python worker.py

# Frontend development
cd frontend
npm install
npm start
```

### Code Quality
- **Linting**: ESLint for JavaScript/TypeScript
- **Testing**: Playwright for E2E testing
- **CI/CD**: GitHub Actions workflow
- **Documentation**: Comprehensive README and code comments

## 📈 Performance

### Two-Stage Pipeline Efficiency
- **Computational Savings**: 72% reduction in Stage 2 processing
- **Detection Rate**: 28% of frames contain birds (typical for wildlife videos)
- **Species ID Success**: 78.6% success rate for bird-containing frames

### Processing Statistics
- **Frame Extraction**: 10 FPS from uploaded videos
- **Binary Detection**: All frames processed through EfficientNet-B0
- **Species ID**: Only bird-containing frames processed through EfficientNet-B3

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `api` | 3001 | Node.js backend API |
| `frontend` | 3000 | React frontend |
| `db` | 5433 | PostgreSQL database |
| `redis` | 6380 | Redis queue |
| `ai-worker` | - | Python AI processing |

## 📁 Project Structure

```
ReelBird/
├── backend/                 # Node.js API server
│   ├── routes/             # API route handlers
│   ├── models/             # Database models
│   ├── scripts/            # Utility scripts
│   └── tests/              # E2E tests
├── ai-worker/              # Python AI service
│   ├── bird_detector.py    # Bird detection models
│   ├── two_stage_detector.py # Two-stage pipeline
│   └── worker.py           # Processing worker
├── frontend/               # React frontend
├── docker-compose.yml      # Service orchestration
└── .github/workflows/      # CI/CD pipelines
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **EfficientNet Models**: Google Research for EfficientNet architectures
- **PyTorch**: Facebook AI Research for the deep learning framework
- **Playwright**: Microsoft for the excellent testing framework
- **Docker**: For containerization and deployment

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the documentation in `/docs`
- Review the test examples in `/backend/tests`

---

**ReelBird** - Making bird identification accessible through AI-powered video analysis.