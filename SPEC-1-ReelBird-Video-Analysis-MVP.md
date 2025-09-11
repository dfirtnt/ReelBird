# SPEC-1-ReelBird Video Analysis MVP

## Background

ReelBird is an application designed to identify birds within user-uploaded videos. Its differentiator is the automated processing of large video files by splitting them into smaller chunks for handling and then generating frame-by-frame image snapshots. These snapshots are analyzed by AI models specialized in bird recognition.

For the MVP, video uploads are the primary ingest method. However, videos are often too large for simple text-based transfers. Splitting, chunked uploads, or state-tracked file transfer mechanisms will be explored to support large file handling. Future enhancements may include ingesting from external sources (e.g., Google Drive links).

## Requirements

### Must Have
- Users can create an account and log in securely.
- Users can upload large video files through the ReelBird platform.
- System supports chunked or resumable uploads for handling large files.
- Uploaded videos are split into frame snapshots at a defined interval (e.g., every 0.1s).
- Each snapshot is processed by an AI bird recognition model.
- Identified birds are stored with associated metadata (time in video, species, confidence score).
- Users can view a basic report of detected birds with timestamps.

### Should Have
- Snapshots are stored temporarily and cleaned up after processing.
- UI provides upload progress and error handling.

### Could Have
- Ingest videos via external links (Google Drive, Dropbox, etc.).
- Adjustable frame-sampling interval (user-defined).

### Won't Have (for MVP)
- Real-time video streaming analysis.
- Advanced user dashboards or community sharing features.

## Method

### Architecture Overview
- **Frontend**: React-based web application (deployable to Vercel/Netlify)
- **Backend**: Node.js/Express API server (containerized for cloud deployment)
- **Database**: PostgreSQL (managed service: AWS RDS, Hostinger PostgreSQL, or Replit DB)
- **File Storage**: Cloud storage (AWS S3, Hostinger storage, or Replit persistent volumes)
- **AI Processing**: Python service with pre-trained models (containerized, scalable)
- **Queue System**: Redis (managed service: AWS ElastiCache, Hostinger Redis, or Replit Redis)
- **Deployment**: Docker containers with cloud-native configuration

### Data Flow
1. User uploads video file via chunked upload to cloud storage
2. Backend creates processing job in queue system
3. Video processing service extracts frame snapshots to temporary storage
4. AI service processes snapshots for bird detection
5. Results stored in managed database with metadata
6. Temporary files cleaned up automatically
7. User views detection report via web interface

### Database Schema
- **Users**: id, email, password_hash, created_at
- **Videos**: id, user_id, filename, cloud_storage_url, duration, status, created_at
- **Detections**: id, video_id, timestamp, species, confidence, bounding_box, created_at

### Algorithms
- **Frame Extraction**: FFmpeg-based video processing at configurable intervals
- **Bird Recognition**: Pre-trained computer vision model (e.g., YOLO, ResNet) specialized for bird species
- **Confidence Scoring**: Threshold-based filtering for detection quality

### Cloud Deployment Strategy
- **Development**: Local Docker Compose setup
- **Staging**: Replit for rapid prototyping and testing
- **Production**: AWS (ECS/EKS) or Hostinger VPS with managed services
- **CI/CD**: GitHub Actions for automated deployment
- **Monitoring**: Cloud-native logging and metrics (CloudWatch, etc.)
- **Scaling**: Horizontal scaling of AI processing workers based on queue depth