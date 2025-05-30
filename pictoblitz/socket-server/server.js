require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'https://pictoblitz.vercel.app'
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active rooms
const rooms = new Map();
// No automatic timer for rounds - rounds will advance manually

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  let currentRoomId = null;

  // Create a new room
  socket.on('create_room', ({ roomName, maxPlayers, maxRounds, user }) => {
    try {
      const roomId = generateRoomId();
      const newRoom = {
        id: roomId,
        name: roomName,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        hostName: user.displayName || 'Anonymous',
        hostPhotoURL: user.photoURL || '',
        status: 'waiting',
        maxPlayers: maxPlayers || 8,
        currentRound: 0,
        maxRounds: maxRounds || 3,
        currentDrawer: '',
        currentWord: '',
        players: [{
          id: user.uid,
          socketId: socket.id,
          name: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '',
          score: 0,
          isHost: true,
          joinedAt: new Date().toISOString()
        }],
        lines: []
      };

      // Store room in memory
      rooms.set(roomId, newRoom);

      // Join socket room
      socket.join(roomId);
      currentRoomId = roomId;

      // Send back room ID
      socket.emit('room_created', { roomId, room: newRoom });
      console.log(`Room created: ${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on('join_room', ({ roomId, user }) => {
    try {
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Check if player is already in the room
      const existingPlayer = room.players.find(player => player.id === user.uid);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id; // Update socket ID if reconnecting
      } else {
        // Add player to room
        room.players.push({
          id: user.uid,
          socketId: socket.id,
          name: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '',
          score: 0,
          isHost: false,
          joinedAt: new Date().toISOString()
        });
      }

      // Join socket room
      socket.join(roomId);
      currentRoomId = roomId;

      // Send room data to all clients in the room
      io.to(roomId).emit('room_updated', room);
      console.log(`Player ${user.uid} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave_room', ({ roomId, user }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return;

      // Remove player from room
      const updatedPlayers = room.players.filter(player => player.id !== user.uid);

      if (updatedPlayers.length === 0) {
        // Delete room if empty
        rooms.delete(roomId);
        io.to(roomId).emit('room_deleted');
      } else {
        // Update room with remaining players
        room.players = updatedPlayers;

        // If the host left, assign a new host
        if (!updatedPlayers.some(player => player.isHost)) {
          updatedPlayers[0].isHost = true;
        }

        // Update room in store
        rooms.set(roomId, room);

        // Notify all clients in the room
        io.to(roomId).emit('room_updated', room);
      }

      // Leave socket room
      socket.leave(roomId);
      if (currentRoomId === roomId) {
        currentRoomId = null;
      }

      console.log(`Player ${user.uid} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Get available rooms
  socket.on('get_available_rooms', () => {
    try {
      const availableRooms = [];
      rooms.forEach((room) => {
        if (room.status === 'waiting') {
          availableRooms.push({
            id: room.id,
            name: room.name,
            hostName: room.hostName,
            players: room.players.length,
            maxPlayers: room.maxPlayers,
            createdAt: room.createdAt
          });
        }
      });

      // Sort by creation time (newest first)
      availableRooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      socket.emit('available_rooms', availableRooms);
    } catch (error) {
      console.error('Error getting available rooms:', error);
      socket.emit('error', { message: 'Failed to get available rooms' });
    }
  });

  // Start game
  socket.on('start_game', ({ roomId, user }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if user is the host
      const player = room.players.find(p => p.id === user.uid);
      if (!player || !player.isHost) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      // Check if enough players
      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Select first drawer randomly
      const randomIndex = Math.floor(Math.random() * room.players.length);
      const firstDrawer = room.players[randomIndex].id;

      // Extended word list
      const words = [
        // Animals
        'cat', 'dog', 'elephant', 'fish', 'giraffe', 'horse', 'lion', 'monkey', 'penguin', 'rabbit', 
        'shark', 'snake', 'tiger', 'turtle', 'wolf', 'zebra', 'bear', 'chicken', 'duck', 'owl',
        
        // Food & Fruits
        'apple', 'banana', 'burger', 'cake', 'carrot', 'cheese', 'cookie', 'grapes', 'hamburger', 'ice cream',
        'lemon', 'orange', 'pizza', 'popcorn', 'sandwich', 'strawberry', 'sushi', 'taco', 'watermelon', 'donut',
        
        // Objects
        'book', 'computer', 'door', 'flower', 'guitar', 'hat', 'key', 'lamp', 'pencil', 'umbrella',
        'backpack', 'bicycle', 'camera', 'chair', 'clock', 'cup', 'glasses', 'shoes', 'table', 'television',
        
        // Places & Nature
        'beach', 'castle', 'city', 'desert', 'forest', 'house', 'island', 'mountain', 'ocean', 'river',
        'school', 'sun', 'tree', 'volcano', 'waterfall', 'bridge', 'cave', 'farm', 'park', 'tent',
        
        // Transportation
        'airplane', 'bus', 'car', 'helicopter', 'motorcycle', 'rocket', 'ship', 'submarine', 'train', 'truck',
        'boat', 'skateboard', 'spaceship', 'tractor', 'ambulance', 'balloon', 'canoe', 'scooter', 'taxi', 'unicycle',
        
        // Clothing
        'jacket', 'shirt', 'shoe', 'sock', 'boot', 'dress', 'glove', 'hat', 'pants', 'scarf',
        'sweater', 'tie', 'belt', 'crown', 'necklace', 'ring', 'watch', 'helmet', 'swimsuit', 'hoodie',
        
        // Sports & Games
        'baseball', 'basketball', 'football', 'soccer', 'tennis', 'volleyball', 'chess', 'dice', 'frisbee', 'kite',
        'puzzle', 'snowboard', 'surfboard', 'swing', 'whistle', 'bowling', 'golf', 'hockey', 'karate', 'ski',
        
        // Body Parts
        'arm', 'ear', 'eye', 'foot', 'hand', 'heart', 'leg', 'nose', 'smile', 'tooth',
        'brain', 'finger', 'hair', 'knee', 'lips', 'muscle', 'shoulder', 'skeleton', 'stomach', 'tongue',
        
        // Weather & Nature
        'cloud', 'fire', 'lightning', 'moon', 'rainbow', 'rain', 'snow', 'star', 'sun', 'tornado',
        'wind', 'comet', 'earth', 'flower', 'hurricane', 'leaf', 'planet', 'storm', 'wave', 'thunder'
      ];
      const randomWord = words[Math.floor(Math.random() * words.length)];

      // Update room
      room.status = 'active';
      room.currentRound = 1;
      room.currentDrawer = firstDrawer;
      room.currentWord = randomWord;
      room.gameStartedAt = new Date().toISOString();
      room.roundStartedAt = new Date().toISOString();
      room.lines = [];

      // Update room in store
      rooms.set(roomId, room);

      // Notify all clients in the room
      io.to(roomId).emit('game_started', room);
      console.log(`Game started in room ${roomId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Drawing update
  socket.on('draw', ({ roomId, drawingData }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return;

      // Add line to the room's lines
      if (Array.isArray(room.lines)) {
        room.lines.push(drawingData);
      } else {
        room.lines = [drawingData];
      }

      // Broadcast to all other clients in the room
      socket.to(roomId).emit('draw_update', drawingData);
    } catch (error) {
      console.error('Error with drawing update:', error);
    }
  });

  // Clear canvas
  socket.on('clear_canvas', ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return;

      // Clear lines
      room.lines = [];

      // Broadcast to all clients in the room
      io.to(roomId).emit('canvas_cleared');
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  });

  // Submit guess
  socket.on('submit_guess', ({ roomId, user, guess }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if player is the current drawer
      if (room.currentDrawer === user.uid) {
        socket.emit('error', { message: 'The drawer cannot guess' });
        return;
      }

      // Check if the guess is correct (case insensitive)
      const isCorrect = guess.toLowerCase().trim() === room.currentWord.toLowerCase();

      // Create message object
      const message = {
        id: Date.now(),
        userId: user.uid,
        sender: room.players.find(p => p.id === user.uid)?.name || 'Anonymous',
        content: guess,
        isCorrect,
        timestamp: new Date().toISOString()
      };

      // If the guess is correct, only send to the guesser and the drawer
      if (isCorrect) {
        // Send to the guesser
        const guesserSocket = room.players.find(p => p.id === user.uid)?.socketId;
        if (guesserSocket) {
          io.to(guesserSocket).emit('new_message', message);
        }
        
        // Send to the drawer
        const drawerSocket = room.players.find(p => p.id === room.currentDrawer)?.socketId;
        if (drawerSocket) {
          io.to(drawerSocket).emit('new_message', message);
        }
      } else {
        // If the guess is incorrect, broadcast to everyone
        io.to(roomId).emit('new_message', message);
      }

      if (isCorrect) {
        // Update scores
        room.players = room.players.map(player => {
          if (player.id === user.uid) {
            // Guesser gets points
            return { ...player, score: player.score + 100 };
          }
          if (player.id === room.currentDrawer) {
            // Drawer gets points too
            return { ...player, score: player.score + 50 };
          }
          return player;
        });

        // Update room in store
        rooms.set(roomId, room);

        // Notify all clients about the correct guess
        io.to(roomId).emit('correct_guess', {
          guesserId: user.uid,
          drawerId: room.currentDrawer,
          room
        });
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      socket.emit('error', { message: 'Failed to submit guess' });
    }
  });

  // Next round
  socket.on('next_round', ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.currentRound >= room.maxRounds) {
        // End game
        room.status = 'completed';
        room.gameEndedAt = new Date().toISOString();

        // Update room in store
        rooms.set(roomId, room);

        // Notify all clients in the room
        io.to(roomId).emit('game_over', room);
        return;
      }

      // Find next drawer
      const currentDrawerIndex = room.players.findIndex(player => player.id === room.currentDrawer);
      const nextDrawerIndex = (currentDrawerIndex + 1) % room.players.length;
      const nextDrawer = room.players[nextDrawerIndex].id;

      // Select new word
      const words = [
        // Animals
        'cat', 'dog', 'elephant', 'fish', 'giraffe', 'horse', 'lion', 'monkey', 'penguin', 'rabbit', 
        'shark', 'snake', 'tiger', 'turtle', 'wolf', 'zebra', 'bear', 'chicken', 'duck', 'owl',
        
        // Food & Fruits
        'apple', 'banana', 'burger', 'cake', 'carrot', 'cheese', 'cookie', 'grapes', 'hamburger', 'ice cream',
        'lemon', 'orange', 'pizza', 'popcorn', 'sandwich', 'strawberry', 'sushi', 'taco', 'watermelon', 'donut',
        
        // Objects
        'book', 'computer', 'door', 'flower', 'guitar', 'hat', 'key', 'lamp', 'pencil', 'umbrella',
        'backpack', 'bicycle', 'camera', 'chair', 'clock', 'cup', 'glasses', 'shoes', 'table', 'television',
        
        // Places & Nature
        'beach', 'castle', 'city', 'desert', 'forest', 'house', 'island', 'mountain', 'ocean', 'river',
        'school', 'sun', 'tree', 'volcano', 'waterfall', 'bridge', 'cave', 'farm', 'park', 'tent',
        
        // Transportation
        'airplane', 'bus', 'car', 'helicopter', 'motorcycle', 'rocket', 'ship', 'submarine', 'train', 'truck',
        'boat', 'skateboard', 'spaceship', 'tractor', 'ambulance', 'balloon', 'canoe', 'scooter', 'taxi', 'unicycle',
        
        // Clothing
        'jacket', 'shirt', 'shoe', 'sock', 'boot', 'dress', 'glove', 'hat', 'pants', 'scarf',
        'sweater', 'tie', 'belt', 'crown', 'necklace', 'ring', 'watch', 'helmet', 'swimsuit', 'hoodie',
        
        // Sports & Games
        'baseball', 'basketball', 'football', 'soccer', 'tennis', 'volleyball', 'chess', 'dice', 'frisbee', 'kite',
        'puzzle', 'snowboard', 'surfboard', 'swing', 'whistle', 'bowling', 'golf', 'hockey', 'karate', 'ski',
        
        // Body Parts
        'arm', 'ear', 'eye', 'foot', 'hand', 'heart', 'leg', 'nose', 'smile', 'tooth',
        'brain', 'finger', 'hair', 'knee', 'lips', 'muscle', 'shoulder', 'skeleton', 'stomach', 'tongue',
        
        // Weather & Nature
        'cloud', 'fire', 'lightning', 'moon', 'rainbow', 'rain', 'snow', 'star', 'sun', 'tornado',
        'wind', 'comet', 'earth', 'flower', 'hurricane', 'leaf', 'planet', 'storm', 'wave', 'thunder'
      ];
      const randomWord = words[Math.floor(Math.random() * words.length)];

      // Update room
      room.currentRound = room.currentRound + 1;
      room.currentDrawer = nextDrawer;
      room.currentWord = randomWord;
      room.lines = [];
      room.roundStartedAt = new Date().toISOString();

      // Update room in store
      rooms.set(roomId, room);

      // Notify all clients in the room
      io.to(roomId).emit('round_started', room);
    } catch (error) {
      console.error('Error moving to next round:', error);
      socket.emit('error', { message: 'Failed to start next round' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find all rooms the user is in
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(player => player.socketId === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        
        // Remove player from room
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          // Delete room if empty
          rooms.delete(roomId);
        } else {
          // If the host left, assign a new host
          if (player.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
          }
          
          // Update room in store
          rooms.set(roomId, room);
          
          // Notify all clients in the room
          io.to(roomId).emit('room_updated', room);
        }
      }
    });
  });
});

// Helper function to generate room IDs
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// No round timeout function needed since rounds advance manually

// Health check route
app.get('/', (req, res) => {
  res.send('PictoBlitz Socket.IO server is running');
});

// Status route
app.get('/status', (req, res) => {
  const activeRooms = [];
  
  rooms.forEach((room, roomId) => {
    activeRooms.push({
      id: roomId,
      name: room.name,
      status: room.status,
      players: room.players.length,
      maxPlayers: room.maxPlayers
    });
  });
  
  res.json({
    status: 'running',
    connections: io.engine.clientsCount,
    activeRooms
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});