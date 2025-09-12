const express = require('express');
const pool = require('../models/database');
const path = require('path');

const router = express.Router();

// Get all videos (for testing - no auth required)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM videos ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get specific video (for testing - no auth required)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1',
      [req.params.id]
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

// Create video record (for testing - no auth required)
router.post('/', async (req, res) => {
  try {
    const { filename, duration } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const result = await pool.query(
      'INSERT INTO videos (user_id, filename, duration, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [1, filename, duration || null, 'uploaded'] // Using user_id = 1 for testing
    );

    const video = result.rows[0];
    res.status(201).json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video record' });
  }
});

// Update video status (for testing - no auth required)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE videos SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
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

// Delete a video (admin endpoint)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated detections first (foreign key constraint)
    await pool.query('DELETE FROM detections WHERE video_id = $1', [id]);
    
    // Delete the video
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({ message: 'Video deleted successfully', video: result.rows[0] });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
