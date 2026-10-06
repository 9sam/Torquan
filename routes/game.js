const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// In-memory storage for likes and online players (in production, use database)
let likeCount = Math.floor(Math.random() * 100) + 50;
let onlinePlayers = new Set();

// Get game info
router.get('/info', async (req, res) => {
  try {
    const gameInfo = {
      name: 'Torquan',
      description: 'A 3D multiplayer world where you can explore, chat, and customize your character',
      maxPlayers: 50,
      currentPlayers: onlinePlayers.size,
      likes: likeCount
    };
    res.json(gameInfo);
  } catch (error) {
    console.error('Get game info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get likes
router.get('/likes', (req, res) => {
  res.json({ likes: likeCount });
});

// Toggle like
router.post('/like', (req, res) => {
  const { increment } = req.body;
  if (increment) {
    likeCount++;
  } else {
    likeCount--;
  }
  res.json({ likes: likeCount });
});

// Update online players
router.post('/online', (req, res) => {
  const { userId, action } = req.body;
  if (action === 'join') {
    onlinePlayers.add(userId);
  } else if (action === 'leave') {
    onlinePlayers.delete(userId);
  }
  res.json({ count: onlinePlayers.size });
});

module.exports = router;
