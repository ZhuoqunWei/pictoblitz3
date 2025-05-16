# PictoBlitz Architecture Diagrams

## High-Level Architecture

```
┌─────────────────────────┐      ┌───────────────────┐
│                         │      │                   │
│  Client Application     │◄────►│  Socket.IO Server │
│  (Next.js)              │      │  (Node.js)        │
│                         │      │                   │
└───────────┬─────────────┘      └───────────────────┘
            │
            │
            ▼
┌─────────────────────────┐
│                         │
│  Firebase Services      │
│  - Authentication       │
│  - Firestore Database   │
│                         │
└─────────────────────────┘
```

## Component Architecture

```
┌───────────────────────────────────────────────────────────────┐
│ Client Application                                            │
│                                                               │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐ │
│ │ Authentication│ │ Room          │ │ Game Room             │ │
│ │ Component     │ │ Management    │ │ ┌───────────────────┐ │ │
│ │               │ │ Component     │ │ │ Canvas Component  │ │ │
│ └───────┬───────┘ └───────┬───────┘ │ └───────────────────┘ │ │
│         │                 │         │ ┌───────────────────┐ │ │
│         │                 │         │ │ Chat Component    │ │ │
│         │                 │         │ └───────────────────┘ │ │
│         │                 │         │ ┌───────────────────┐ │ │
│         │                 │         │ │ Players Component │ │ │
│         │                 │         │ └───────────────────┘ │ │
│         │                 │         └───────────────────────┘ │
│         ▼                 ▼                     ▼             │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │                  Service Layer                          │   │
│ │ ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐ │   │
│ │ │ authService  │ │ roomService  │ │ socketService     │ │   │
│ │ └──────────────┘ └──────────────┘ └───────────────────┘ │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌───────────────┐     Authentication     ┌───────────────┐
│               │◄────────────────────►  │               │
│    Client     │                        │   Firebase    │
│    Browser    │                        │   Auth        │
│               │                        │               │
└───────┬───────┘                        └───────────────┘
        │
        │ Socket.IO Events
        ▼
┌───────────────┐     Game State         ┌───────────────┐
│               │◄────────────────────►  │               │
│  Socket.IO    │                        │   In-Memory   │
│  Server       │                        │   State       │
│               │                        │               │
└───────────────┘                        └───────────────┘
```

## Sequence Diagram - Game Flow

```
┌──────┐          ┌──────┐          ┌──────┐          ┌───────────┐
│Client│          │Server│          │Client│          │Firebase   │
│(Host)│          │      │          │(User)│          │Auth       │
└──┬───┘          └──┬───┘          └──┬───┘          └─────┬─────┘
   │  Authenticate   │                 │  Authenticate      │
   │─────────────────┼────────────────►│◄─────────────────► │
   │                 │                 │                     │
   │  Create Room    │                 │                     │
   │────────────────►│                 │                     │
   │                 │                 │                     │
   │                 │  Join Room      │                     │
   │                 │◄────────────────┘                     │
   │                 │                                       │
   │                 │  Room Updated                         │
   │◄────────────────┼────────────────►│                     │
   │                 │                 │                     │
   │  Start Game     │                 │                     │
   │────────────────►│                 │                     │
   │                 │                 │                     │
   │                 │  Game Started   │                     │
   │◄────────────────┼────────────────►│                     │
   │                 │                 │                     │
   │  Drawing Data   │                 │                     │
   │────────────────►│                 │                     │
   │                 │                 │                     │
   │                 │  Drawing Update │                     │
   │                 │────────────────►│                     │
   │                 │                 │                     │
   │                 │  Submit Guess   │                     │
   │                 │◄────────────────┘                     │
   │                 │                                       │
   │                 │  Correct Guess                        │
   │◄────────────────┼────────────────►│                     │
   │                 │                 │                     │
   │  Next Round     │                 │                     │
   │────────────────►│                 │                     │
   │                 │                 │                     │
   │                 │  Round Started  │                     │
   │◄────────────────┼────────────────►│                     │
   │                 │                 │                     │
   │  End Game       │                 │                     │
   │────────────────►│                 │                     │
   │                 │                 │                     │
   │                 │  Game Over      │                     │
   │◄────────────────┼────────────────►│                     │
┌──┴───┐          ┌──┴───┐          ┌──┴───┐          ┌─────┴─────┐
│Client│          │Server│          │Client│          │Firebase   │
│(Host)│          │      │          │(User)│          │Auth       │
└──────┘          └──────┘          └──────┘          └───────────┘
```

## Class/Module Diagram

```
┌─────────────────────────┐
│ socketService.js        │
├─────────────────────────┤
│ - initializeSocket()    │
│ - getSocket()           │
│ - disconnectSocket()    │
│ - createRoom()          │
│ - joinRoom()            │
│ - leaveRoom()           │
│ - getAvailableRooms()   │
│ - startGame()           │
│ - sendDrawingData()     │
│ - clearCanvas()         │
│ - submitGuess()         │
│ - nextRound()           │
│ - subscribeToXXX()      │
└─────────────────────────┘
          ▲
          │
          │
┌─────────────────────────┐     ┌─────────────────────────┐
│ Game Component          │     │ firebase.js             │
├─────────────────────────┤     ├─────────────────────────┤
│ - join/leave room       │     │ - auth                  │
│ - handle drawing        │────►│ - db                    │
│ - handle guessing       │     │ - signInWithGoogle()    │
│ - manage game state     │     │ - signOut()             │
└─────────────────────────┘     │ - getCurrentUser()      │
                                └─────────────────────────┘
                                          ▲
                                          │
                                          │
                                ┌─────────────────────────┐
                                │ gameService.js          │
                                ├─────────────────────────┤
                                │ - createRoom()          │
                                │ - joinRoom()            │
                                │ - leaveRoom()           │
                                │ - getAvailableRooms()   │
                                │ - getRoomDetails()      │
                                │ - subscribeToRoom()     │
                                │ - startGame()           │
                                │ - submitGuess()         │
                                │ - nextRound()           │
                                └─────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────┐
│                         │
│  Client Application     │◄──┐
│  (Deployed on Vercel)   │   │
│                         │   │
└─────────────────────────┘   │ HTTPS/WSS
                              │
                              │
┌─────────────────────────┐   │
│                         │   │
│  Socket.IO Server       │───┘
│  (Deployed on Heroku)   │
│                         │
└─────────────────────────┘
          │
          │ HTTPS
          ▼
┌─────────────────────────┐
│                         │
│  Firebase Services      │
│  (Google Cloud)         │
│                         │
└─────────────────────────┘
```