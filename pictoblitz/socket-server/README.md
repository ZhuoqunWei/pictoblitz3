# PictoBlitz Socket.IO Server

This is the Socket.IO server for the PictoBlitz multiplayer drawing game. It provides real-time communication between players, manages game rooms, and handles the game state.

## Features

- Real-time WebSocket communication using Socket.IO
- Game room creation and management
- Player joining and leaving
- Real-time drawing synchronization
- Game state management (rounds, words, scores)
- Chat with guessing functionality

## Deployment

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example` and configure as needed.

3. Start the development server:
   ```
   npm run dev
   ```

### Deployment on Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect this repository
3. Set the following environment variables:
   - `PORT` (Railway will set this automatically)
   - `CLIENT_URL` (your Vercel frontend URL)
4. Deploy

### Deployment on Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect this repository
3. Choose "Node" as the runtime
4. Set the following environment variables:
   - `PORT` (Render will set this automatically)
   - `CLIENT_URL` (your Vercel frontend URL)
5. Deploy

## API

The server uses Socket.IO events for communication:

### Room Management
- `create_room`: Create a new game room
- `join_room`: Join an existing room
- `leave_room`: Leave a room
- `get_available_rooms`: Get list of available rooms

### Game Flow
- `start_game`: Start a game
- `next_round`: Move to the next round
- `game_over`: End the game

### Drawing
- `draw`: Send drawing data
- `draw_update`: Receive drawing updates
- `clear_canvas`: Clear the canvas

### Chat and Guessing
- `submit_guess`: Submit a guess
- `new_message`: Receive a new chat message
- `correct_guess`: Notify of a correct guess

## License

ISC