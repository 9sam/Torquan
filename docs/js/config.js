// ============================================
// TORQUAN CONFIGURATION
// ============================================
// This file connects your GitHub Pages frontend to your Render backend
//
// IMPORTANT: Replace the URLs below with YOUR actual Render backend URL
// After you deploy your backend to Render, update these URLs!
// ============================================

// API endpoint for authentication and user data
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://YOUR-BACKEND-URL.onrender.com/api'; // REPLACE THIS with your Render backend URL

// Socket.io connection for real-time multiplayer
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://YOUR-BACKEND-URL.onrender.com'; // REPLACE THIS with your Render backend URL

// Make these available globally
window.API_BASE = API_BASE;
window.SOCKET_URL = SOCKET_URL;
