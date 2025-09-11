const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../models/database');

const router = express.Router();

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

// Get detections for a video
router.get('/video/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Verify user owns the video
    const videoResult = await pool.query(
      'SELECT id FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, req.user.userId]
    );
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const result = await pool.query(
      'SELECT * FROM detections WHERE video_id = $1 ORDER BY timestamp ASC',
      [videoId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching detections:', error);
    res.status(500).json({ error: 'Failed to fetch detections' });
  }
});

// Get detection summary for a video
router.get('/video/:videoId/summary', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Verify user owns the video
    const videoResult = await pool.query(
      'SELECT id FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, req.user.userId]
    );
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const result = await pool.query(`
      SELECT 
        species,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence,
        MIN(timestamp) as first_seen,
        MAX(timestamp) as last_seen
      FROM detections 
      WHERE video_id = $1 
      GROUP BY species 
      ORDER BY count DESC
    `, [videoId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching detection summary:', error);
    res.status(500).json({ error: 'Failed to fetch detection summary' });
  }
});

// Create detection (called by AI worker)
router.post('/', async (req, res) => {
  try {
    const { video_id, timestamp, species, confidence, bounding_box } = req.body;
    
    const result = await pool.query(
      'INSERT INTO detections (video_id, timestamp, species, confidence, bounding_box) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [video_id, timestamp, species, confidence, bounding_box]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating detection:', error);
    res.status(500).json({ error: 'Failed to create detection' });
  }
});

module.exports = router;
