const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../models/database');
const Bull = require('bull');
const path = require('path');

const router = express.Router();

// Redis queue for video processing
const videoQueue = new Bull('video processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user's videos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get specific video
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Create video record (called after tusd upload)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { filename, duration } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const result = await pool.query(
      'INSERT INTO videos (user_id, filename, duration, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, filename, duration || null, 'uploaded']
    );

    const video = result.rows[0];

    // Add to processing queue
    await videoQueue.add('process-video', {
      videoId: video.id,
      filename: video.filename,
      userId: req.user.userId
    });

    res.status(201).json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video record' });
  }
});

// Update video status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE videos SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating video status:', error);
    res.status(500).json({ error: 'Failed to update video status' });
  }
});

module.exports = router;
