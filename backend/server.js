const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const path = require('path');
require('dotenv').config();

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test route
app.post('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// File upload endpoint (using different path to avoid conflicts)
console.log('Registering upload route...');
const multer = require('multer');
const pool = require('./models/database');
const redis = require('redis');
const { spawn } = require('child_process');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/app/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// Initialize Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect().catch(console.error);

// Function to extract frames using FFmpeg at 10 FPS
const extractFrames = async (videoPath, videoId) => {
  return new Promise((resolve, reject) => {
    const framesDir = `/app/frames/${videoId}`;
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vf', 'fps=10', // Extract at 10 FPS
      '-q:v', '2', // High quality
      `${framesDir}/frame_%04d.jpg`
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`Frames extracted for video ${videoId}`);
        resolve();
      } else {
        console.error(`FFmpeg process exited with code ${code}`);
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg error:', error);
      reject(error);
    });
  });
};

app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Create video record
    const videoResult = await pool.query(
      'INSERT INTO videos (user_id, filename, status) VALUES ($1, $2, $3) RETURNING *',
      [1, req.file.filename, 'uploaded'] // Using user_id = 1 for testing
    );

    const video = videoResult.rows[0];
    const videoId = video.id;
    const videoPath = req.file.path;

    // Update status to processing
    await pool.query(
      'UPDATE videos SET status = $1 WHERE id = $2',
      ['processing', videoId]
    );

    // Create frames directory
    const framesDir = `/app/frames/${videoId}`;
    const fs = require('fs');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // Extract frames asynchronously at 10 FPS
    extractFrames(videoPath, videoId)
      .then(async () => {
        // Update status to frames_extracted
        await pool.query(
          'UPDATE videos SET status = $1 WHERE id = $2',
          ['frames_extracted', videoId]
        );

        // Add to AI processing queue
        await redisClient.lPush('video_processing', JSON.stringify({
          videoId: videoId,
          framesDir: framesDir
        }));

        console.log(`Video ${videoId} queued for AI processing`);
      })
      .catch(async (error) => {
        console.error(`Frame extraction failed for video ${videoId}:`, error);
        await pool.query(
          'UPDATE videos SET status = $1 WHERE id = $2',
          ['failed', videoId]
        );
      });

    res.json({
      message: 'Video uploaded successfully',
      video: video
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});
console.log('Upload route registered');

// Routes
app.use('/api/videos', require('./routes/videos'));
app.use('/api/detections', require('./routes/detections'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
