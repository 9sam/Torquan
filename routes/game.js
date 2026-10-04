const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// Get game info
router.get('/info', async (req, res) => {
  try {
    const gameInfo = {
      name: 'Torquan',
      description: 'A 3D multiplayer world where you can explore, chat, and customize your character',
      maxPlayers: 50,
      currentPlayers: 0 // This would be dynamically updated in production
    };
    res.json(gameInfo);
  } catch (error) {
    console.error('Get game info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
