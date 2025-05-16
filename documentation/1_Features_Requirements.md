# PictoBlitz Features & Requirements

## Application Overview
PictoBlitz is a real-time multiplayer drawing and guessing game similar to Pictionary. Players take turns drawing a given word while others try to guess it as quickly as possible to earn points.

## Core Features

### 1. User Authentication
**Description:** Users can authenticate using Google authentication to participate in games.

**Requirements:**
- Allow users to sign in with Google credentials
- Display user's name and profile picture in the game
- Maintain authentication state throughout the session
- Support anonymous guest access (disabled in current version)

### 2. Room Management
**Description:** Players can create, join, and manage game rooms.

**Requirements:**
- Create new game rooms with customizable settings
- Browse and join existing game rooms
- Configure room settings like max players and rounds
- Assign a host role to one player per room
- Maintain room state across player connections
- Handle player disconnections gracefully

### 3. Game Flow
**Description:** The application manages the complete game lifecycle from waiting room to game completion.

**Requirements:**
- Support waiting room state for players to join
- Randomize drawer selection for each round
- Manage round transitions
- Track and update game state in real-time
- Support manual round advancement by the drawer
- Display final scores and winner at game completion

### 4. Drawing Mechanics
**Description:** The drawer can create drawings on a canvas that are synchronized to all players in real-time.

**Requirements:**
- Provide a real-time synchronized drawing canvas
- Support various drawing tools (colors, line widths)
- Allow clearing the canvas
- Send drawing data efficiently to minimize lag
- Properly scale canvas for different screen sizes

### 5. Guessing System
**Description:** Players can submit guesses and receive immediate feedback.

**Requirements:**
- Allow non-drawers to submit text guesses
- Validate guesses against the current word
- Award points for correct guesses
- Show guesses in the chat for all players
- Hide correct guesses from other players
- Display feedback for correct guesses

### 6. Scoring System
**Description:** Track player performance with a points-based scoring system.

**Requirements:**
- Award 100 points to players who guess correctly
- Award 50 points to the drawer when someone guesses correctly
- Display real-time score updates on the leaderboard
- Sort player list by score
- Highlight the winner at the end of the game

### 7. Word Selection
**Description:** Provide a diverse set of words for players to draw.

**Requirements:**
- Maintain a diverse word bank categorized by themes
- Select random words from the word bank for each round
- Show the word only to the current drawer
- Ensure fair word selection without repeats within a game

### 8. Real-time Communication
**Description:** All game actions and chat messages are synchronized in real-time.

**Requirements:**
- Implement real-time data synchronization with Socket.IO
- Support chat functionality for guesses
- Provide immediate feedback on game events
- Handle network disruptions and reconnections
- Show system messages for game events

### 9. Responsive UI
**Description:** The application works well on various screen sizes and devices.

**Requirements:**
- Adapt the layout for different screen sizes
- Provide a clean, intuitive user interface
- Show visual feedback for game state changes
- Support mobile touch interactions (partially implemented)
- Maintain usability across different devices

## Technical Requirements

### 1. Performance
- Support real-time communication with minimal latency
- Efficiently handle drawing data transmission
- Support multiple concurrent game rooms
- Scale to handle many concurrent users

### 2. Security
- Authenticate users securely
- Validate all user inputs
- Prevent cheating (e.g., seeing the word as a non-drawer)
- Protect against common web vulnerabilities

### 3. Reliability
- Handle disconnections and reconnections gracefully
- Maintain game state consistency across clients
- Recover from errors without disrupting gameplay
- Provide clear error messages when issues occur

### 4. Technology Stack
- Next.js frontend for UI rendering
- Socket.IO for real-time communication
- Firebase for authentication and data storage
- Node.js for the socket server
- Tailwind CSS for styling