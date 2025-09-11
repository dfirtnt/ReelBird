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
- **Frontend**: React-based web application for user interface
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL for user data and bird detection results
- **File Storage**: Local filesystem for video files and temporary snapshots
- **AI Processing**: Python service for bird recognition using pre-trained models
- **Queue System**: Redis for job queuing and processing coordination

### Data Flow
1. User uploads video file via chunked upload
2. Backend stores video file and creates processing job
3. Video processing service extracts frame snapshots
4. AI service processes snapshots for bird detection
5. Results stored in database with metadata
6. User views detection report via web interface

### Database Schema
- **Users**: id, email, password_hash, created_at
- **Videos**: id, user_id, filename, file_path, duration, status, created_at
- **Detections**: id, video_id, timestamp, species, confidence, bounding_box, created_at

### Algorithms
- **Frame Extraction**: FFmpeg-based video processing at configurable intervals
- **Bird Recognition**: Pre-trained computer vision model (e.g., YOLO, ResNet) specialized for bird species
- **Confidence Scoring**: Threshold-based filtering for detection quality