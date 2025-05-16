# PictoBlitz Technical Implementation

## Technology Stack

PictoBlitz uses a modern web technology stack:

- **Frontend Framework**: Next.js (React)
- **Backend Server**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **Authentication & Database**: Firebase (Authentication, Firestore)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (frontend), Heroku (socket server)

## Core Components

### 1. Socket Server (`/socket-server/server.js`)

The Socket.IO server is the backbone of real-time communication in PictoBlitz. It:

- Manages room creation, joining, and leaving
- Tracks game state and player information
- Handles drawing data transmission between clients
- Processes guesses and validates correct answers
- Manages game flow including round transitions

Key implementation details:
- Uses in-memory storage (Map object) for room and game state
- Implements room-based communication using Socket.IO rooms
- Handles player disconnections and reconnections
- Provides REST endpoints for health checks and server status

### 2. Socket Service (`/src/lib/socketService.js`)

Client-side service that interfaces with the Socket.IO server:

- Establishes and maintains socket connections
- Provides methods for all game-related actions
- Sets up event subscriptions for real-time updates
- Handles connection errors and reconnection

Key implementation details:
- Singleton pattern to maintain a single socket instance
- Promise-based API for asynchronous operations
- Comprehensive event subscription system

### 3. Game Service (`/src/lib/gameService.js`)

Interfaces with Firebase Firestore for persistent data:

- Manages room data in Firestore
- Handles player management
- Provides methods for game actions
- Implements real-time subscriptions using Firestore listeners

Key implementation details:
- Uses Firebase Authentication for user validation
- Implements Firestore security rules
- Handles concurrent access with transaction-based updates

### 4. Game Component (`/src/app/game/[roomId]/page.js`)

The main game interface that:

- Manages the game UI and state
- Handles canvas drawing functionality
- Processes user inputs for drawing and guessing
- Displays real-time updates to all players

Key implementation details:
- Canvas-based drawing implementation
- Real-time state management with React hooks
- Responsive design with Tailwind CSS
- Dynamic routing with Next.js

## Key Technical Features

### 1. Real-time Drawing Synchronization

Drawing data is synchronized in real-time between players:

```javascript
// From socketService.js
export const sendDrawingData = (roomId, drawingData) => {
  const socket = getSocket();
  socket.emit('draw', { roomId, drawingData });
};

// From page.js (Game component)
const handleMouseMove = (e) => {
  if (!mouseDown) return;
  
  const currentPosition = getCurrentPosition(e);
  const ctx = canvasRef.current?.getContext("2d");
  
  if (!ctx || !currentPosition) return;
  
  // Draw on local canvas
  drawLine(ctx, prevPoint.current || currentPosition, currentPosition, currentColor, currentLineWidth);
  
  // Send drawing data to server
  const drawingData = {
    startX: (prevPoint.current || currentPosition).x,
    startY: (prevPoint.current || currentPosition).y,
    endX: currentPosition.x,
    endY: currentPosition.y,
    color: currentColor,
    width: currentLineWidth
  };
  
  sendDrawingData(roomId, drawingData);
  
  prevPoint.current = currentPosition;
};
```

### 2. Guess Validation

The server validates guesses against the current word:

```javascript
// From server.js
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
```

### 3. Game Flow Management

The game progresses through distinct phases:

1. **Waiting Room**: Players join the room before the game starts
2. **Game Start**: The host initiates the game
3. **Round Flow**: Players take turns drawing, with manual round advancement
4. **Game Completion**: Final scores are displayed

```javascript
// Next round logic from server.js
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
    const words = [/* word list */];
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
```

## Performance Optimizations

1. **Efficient Drawing Data Transmission**
   - Transmits only essential drawing data (points, color, width)
   - Uses client-side rendering to minimize data transfer
   - Optimizes canvas updates for smooth drawing

2. **Room-Based Communication**
   - Uses Socket.IO rooms to limit message broadcast scope
   - Only sends updates to relevant clients
   - Reduces server load and network traffic

3. **Reconnection Handling**
   - Maintains player sessions across disconnections
   - Preserves game state during temporary disconnections
   - Handles socket reconnections gracefully

## Security Considerations

1. **User Authentication**
   - Firebase Authentication for secure user identity
   - Server-side validation of user identity

2. **Input Validation**
   - Server-side validation of all user inputs
   - Protection against injection attacks

3. **Game Integrity**
   - Server-side validation of game actions
   - Prevention of common cheating methods
   - Hiding the word from non-drawers

## Scalability Considerations

The current implementation has some scalability limitations:

1. **In-Memory State**
   - Game state is stored in memory on the socket server
   - Not suitable for horizontal scaling without additional infrastructure

2. **Future Improvements**
   - Implement Redis for distributed state management
   - Add database persistence for game history
   - Implement load balancing for the socket server