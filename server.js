require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'torquan-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Import routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const userRoutes = require('./routes/user');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io for real-time multiplayer
const connectedPlayers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Player joins game
  socket.on('joinGame', (data) => {
    const { userId, username, bodyColor } = data;
    connectedPlayers.set(socket.id, {
      userId,
      username,
      bodyColor,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    });

    // Send current players to the new player
    const players = Array.from(connectedPlayers.entries()).map(([id, player]) => ({
      socketId: id,
      ...player
    }));
    socket.emit('currentPlayers', players);

    // Notify other players about new player
    socket.broadcast.emit('newPlayer', {
      socketId: socket.id,
      ...connectedPlayers.get(socket.id)
    });
  });

  // Player movement
  socket.on('playerMove', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      socket.broadcast.emit('playerMoved', {
        socketId: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  // Chat messages
  socket.on('chatMessage', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      const message = {
        username: player.username,
        message: data.message,
        timestamp: new Date().toISOString()
      };
      io.emit('chatMessage', message);
    }
  });

  // Player color change
  socket.on('changeColor', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      player.bodyColor = data.color;
      io.emit('playerColorChanged', {
        socketId: socket.id,
        color: data.color
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedPlayers.delete(socket.id);
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Torquan server running on port ${PORT}`);
});
