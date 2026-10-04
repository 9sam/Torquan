const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db/config');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Update body color
router.put('/color', authenticateToken, async (req, res) => {
  try {
    const { bodyColor } = req.body;

    if (!bodyColor) {
      return res.status(400).json({ error: 'Body color is required' });
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(bodyColor)) {
      return res.status(400).json({ error: 'Invalid color format. Use hex format like #00ff00' });
    }

    await pool.query(
      'UPDATE users SET body_color = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [bodyColor, req.user.userId]
    );

    res.json({ message: 'Body color updated successfully', bodyColor });
  } catch (error) {
    console.error('Update color error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await pool.query(
      'SELECT id, username, body_color, created_at FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
