import { io } from 'socket.io-client';

// Socket.IO client service for PictoBlitz
let socket;

export const initializeSocket = () => {
  // Don't initialize multiple sockets
  if (socket) return socket;

  // Get the Socket.IO server URL from environment variable or use default
  const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';

  // Initialize socket connection
  socket = io(socketServerUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Socket connection event handlers
  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from Socket.IO server:', reason);
  });

  return socket;
};

// Ensure socket is disconnected when needed
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get the socket instance (initializing if necessary)
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Room Management
export const createRoom = (roomData) => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    // Set up one-time event handler for response
    socket.once('room_created', (data) => {
      resolve(data);
    });
    
    socket.once('error', (error) => {
      reject(error);
    });
    
    // Send create room request
    socket.emit('create_room', roomData);
  });
};

export const joinRoom = (roomId, user) => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    // Set up one-time event handler for room update
    socket.once('room_updated', (room) => {
      resolve(room);
    });
    
    socket.once('error', (error) => {
      reject(error);
    });
    
    // Send join room request
    socket.emit('join_room', { roomId, user });
  });
};

export const leaveRoom = (roomId, user) => {
  const socket = getSocket();
  socket.emit('leave_room', { roomId, user });
};

export const getAvailableRooms = () => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    // Set up one-time event handler for available rooms
    socket.once('available_rooms', (rooms) => {
      resolve(rooms);
    });
    
    socket.once('error', (error) => {
      reject(error);
    });
    
    // Send get available rooms request
    socket.emit('get_available_rooms');
  });
};

// Game Flow
export const startGame = (roomId, user) => {
  const socket = getSocket();
  socket.emit('start_game', { roomId, user });
};

export const nextRound = (roomId) => {
  const socket = getSocket();
  socket.emit('next_round', { roomId });
};

// Drawing
export const sendDrawingData = (roomId, drawingData) => {
  const socket = getSocket();
  socket.emit('draw', { roomId, drawingData });
};

export const clearCanvas = (roomId) => {
  const socket = getSocket();
  socket.emit('clear_canvas', { roomId });
};

// Chat and Guessing
export const submitGuess = (roomId, user, guess) => {
  const socket = getSocket();
  socket.emit('submit_guess', { roomId, user, guess });
};

// Subscriptions
export const subscribeToRoomUpdates = (callback) => {
  const socket = getSocket();
  socket.on('room_updated', callback);
  return () => socket.off('room_updated', callback);
};

export const subscribeToGameStarted = (callback) => {
  const socket = getSocket();
  socket.on('game_started', callback);
  return () => socket.off('game_started', callback);
};

export const subscribeToRoundStarted = (callback) => {
  const socket = getSocket();
  socket.on('round_started', callback);
  return () => socket.off('round_started', callback);
};

export const subscribeToGameOver = (callback) => {
  const socket = getSocket();
  socket.on('game_over', callback);
  return () => socket.off('game_over', callback);
};

export const subscribeToDrawingUpdates = (callback) => {
  const socket = getSocket();
  socket.on('draw_update', callback);
  return () => socket.off('draw_update', callback);
};

export const subscribeToCanvasCleared = (callback) => {
  const socket = getSocket();
  socket.on('canvas_cleared', callback);
  return () => socket.off('canvas_cleared', callback);
};

export const subscribeToNewMessages = (callback) => {
  const socket = getSocket();
  socket.on('new_message', callback);
  return () => socket.off('new_message', callback);
};

export const subscribeToCorrectGuess = (callback) => {
  const socket = getSocket();
  socket.on('correct_guess', callback);
  return () => socket.off('correct_guess', callback);
};

export const subscribeToRoomDeleted = (callback) => {
  const socket = getSocket();
  socket.on('room_deleted', callback);
  return () => socket.off('room_deleted', callback);
};

export const subscribeToErrors = (callback) => {
  const socket = getSocket();
  socket.on('error', callback);
  return () => socket.off('error', callback);
};

export const subscribeToRoundTimeUp = (callback) => {
  const socket = getSocket();
  socket.on('round_time_up', callback);
  return () => socket.off('round_time_up', callback);
};