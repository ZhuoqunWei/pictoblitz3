# PictoBlitz Application Usage Guide

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Google Firebase account (for authentication)

### Running Locally

#### 1. Setting up the Socket.IO Server

Navigate to the socket-server directory:
```
cd pictoblitz/socket-server
```

Install dependencies:
```
npm install
```

Start the socket server:
```
npm start
```

The server will run on port 4000 by default.

#### 2. Setting up the Client Application

In a new terminal, navigate to the pictoblitz directory:
```
cd pictoblitz
```

Install dependencies:
```
npm install
```

Create a `.env.local` file with the following variables:
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Socket.IO Server URL (for local development)
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:4000
```

Start the development server:
```
npm run dev
```

The application will be available at http://localhost:3000.

## Using the Application

### Authentication

1. When you visit the application, you'll be presented with the login screen.
2. Click "Sign in with Google" to authenticate.
3. Choose your Google account from the popup window.
4. Once authenticated, you'll be redirected to the rooms page.

### Creating a Game Room

1. After signing in, you'll see the "Create New Room" button on the rooms page.
2. Click it to create a new game room.
3. Enter a name for your room.
4. Set the maximum number of players (2-8).
5. Set the number of rounds (1-10).
6. Click "Create Room" to proceed.
7. As the creator, you'll automatically be the host of the room.

### Joining a Game Room

1. On the rooms page, you'll see a list of available game rooms.
2. Each room shows the room name, host, and player count.
3. Click "Join" on any room to enter it.
4. If a room is full, the "Join" button will be disabled.

### In the Waiting Room

1. After creating or joining a room, you'll enter the waiting room.
2. Here, you can see all players who have joined.
3. The host has a "Host" label next to their name.
4. Only the host can start the game by clicking the "Start Game" button.
5. The game requires at least 2 players to start.

### Playing the Game

#### As the Drawer

1. When it's your turn to draw, you'll see the word you need to draw at the top of the screen.
2. Use the drawing tools at the bottom of the canvas:
   - Color picker to change the drawing color
   - Line width selector to adjust stroke thickness
   - Clear button to erase the entire canvas
3. Draw the word using the mouse (click and drag).
4. When you feel players have had enough time or someone has guessed correctly, click "End Round & Continue" to move to the next round.

#### As a Guesser

1. When you're not drawing, you'll see the canvas with someone else's drawing.
2. Use the chat box to submit your guesses.
3. If your guess is correct:
   - You'll see "Correct! You guessed the word!"
   - Your score will increase by 100 points
   - The drawer gets 50 points
   - Other players will see that you guessed correctly but won't see the word
4. If your guess is incorrect, it will appear in the chat for everyone to see.

### Game Completion

1. After all rounds are completed, the game ends and displays final scores.
2. Players are ranked by their points.
3. The winner is highlighted at the top.
4. Click "Back to Rooms" to return to the room list and start a new game.

### Leaving a Game

- You can leave a game at any time by clicking the "Leave Room" button in the top right corner.
- If you're the host and leave, host privileges will pass to another player.
- If all players leave, the room is automatically deleted.

## Tips for Playing

1. **For Drawers:**
   - Start with simple shapes that represent the word.
   - If players are struggling, add more details to help them guess.
   - Use different colors to make your drawing clearer.
   - The word bank includes categories like animals, food, objects, places, transportation, clothing, sports, body parts, and weather.

2. **For Guessers:**
   - Pay attention to drawing shapes and context.
   - Try synonyms if your first guess is wrong but close.
   - Watch other players' guesses for clues.
   - Keep guesses short and simple.

3. **General Tips:**
   - The game works best with 3-6 players.
   - Short words (4-8 letters) are often easier to draw and guess.
   - Take turns being the host across multiple games.
   - Be patient with new players as they learn the game mechanics.