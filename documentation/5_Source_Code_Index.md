# PictoBlitz Source Code Index

This document provides an overview of the key source code files and their purpose within the PictoBlitz application.

## Client Application (`/pictoblitz`)

### Core Application Files

| File | Description |
|------|-------------|
| `/pictoblitz/next.config.mjs` | Next.js configuration file |
| `/pictoblitz/tailwind.config.mjs` | Tailwind CSS configuration |
| `/pictoblitz/postcss.config.mjs` | PostCSS configuration for Tailwind |
| `/pictoblitz/eslint.config.mjs` | ESLint configuration for code quality |
| `/pictoblitz/package.json` | npm dependencies and scripts |

### Application Pages

| File | Description |
|------|-------------|
| `/pictoblitz/src/app/layout.js` | Root layout component for the application |
| `/pictoblitz/src/app/page.js` | Home page with authentication |
| `/pictoblitz/src/app/rooms/page.js` | Room listing and creation page |
| `/pictoblitz/src/app/game/[roomId]/page.js` | Main game interface with canvas and chat |
| `/pictoblitz/src/app/profile/page.js` | User profile and stats page |
| `/pictoblitz/src/app/globals.css` | Global CSS styling |

### Service Libraries

| File | Description |
|------|-------------|
| `/pictoblitz/src/lib/firebase.js` | Firebase configuration and service initialization |
| `/pictoblitz/src/lib/socketService.js` | Socket.IO client service for real-time communication |
| `/pictoblitz/src/lib/gameService.js` | Game state management with Firestore |
| `/pictoblitz/src/lib/drawingUtils.js` | Canvas drawing utility functions |

## Socket Server (`/pictoblitz/socket-server`)

| File | Description |
|------|-------------|
| `/pictoblitz/socket-server/server.js` | Main Socket.IO server implementation |
| `/pictoblitz/socket-server/package.json` | Server dependencies and scripts |
| `/pictoblitz/socket-server/Procfile` | Heroku deployment configuration |

## Key Components and Functionality

### Authentication

Authentication is handled primarily through:
- `/pictoblitz/src/lib/firebase.js` - Firebase authentication setup
- `/pictoblitz/src/app/page.js` - Login interface and authentication flow

### Room Management

Room creation and management is implemented in:
- Client: `/pictoblitz/src/app/rooms/page.js` - UI for room listing and creation
- Client: `/pictoblitz/src/lib/socketService.js` - Methods for room operations
- Server: `/pictoblitz/socket-server/server.js` - Room state management

### Drawing Functionality

The drawing canvas is implemented in:
- `/pictoblitz/src/app/game/[roomId]/page.js` - Canvas setup and drawing handlers
- `/pictoblitz/src/lib/drawingUtils.js` - Drawing utility functions
- `/pictoblitz/src/lib/socketService.js` - Real-time drawing data transmission

### Game Logic

Core game logic is distributed across:
- Client: `/pictoblitz/src/app/game/[roomId]/page.js` - Game UI and client-side logic
- Client: `/pictoblitz/src/lib/socketService.js` - Game action methods
- Server: `/pictoblitz/socket-server/server.js` - Game state management and rules

### Chat and Guessing

The chat system and guess handling is implemented in:
- Client: `/pictoblitz/src/app/game/[roomId]/page.js` - Chat UI and guess submission
- Server: `/pictoblitz/socket-server/server.js` - Guess validation and scoring

## Code Structure Patterns

The codebase follows several patterns:

1. **Service Modules**
   - Separation of concerns with dedicated service modules
   - Clear APIs for interaction between components

2. **React Hooks**
   - Extensive use of React hooks for state management
   - Custom hooks for Socket.IO and Firebase integrations

3. **Event-Driven Architecture**
   - Socket.IO events for real-time communication
   - Subscription patterns for event handling

4. **Responsive Design**
   - Tailwind CSS for responsive UI components
   - Mobile-friendly layout adaptations