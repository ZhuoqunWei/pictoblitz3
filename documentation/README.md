# PictoBlitz Documentation

Welcome to the PictoBlitz documentation repository. This folder contains comprehensive documentation about the PictoBlitz multiplayer drawing and guessing game.

## Documentation Structure

1. **[Features & Requirements](./1_Features_Requirements.md)**
   - Detailed description of application features
   - Functional and technical requirements
   - Core gameplay mechanics

2. **[Architecture Diagrams](./2_Architecture_Diagrams.md)**
   - High-level architecture
   - Component architecture
   - Data flow diagrams
   - Sequence diagrams
   - Module relationships

3. **[Application Usage](./3_Application_Usage.md)**
   - Setup instructions
   - User guide for playing the game
   - Feature walkthrough
   - Tips and best practices

4. **[Technical Implementation](./4_Technical_Implementation.md)**
   - Technology stack details
   - Key implementation patterns
   - Code structure overview
   - Performance considerations
   - Security implementation

## Application Overview

PictoBlitz is a real-time multiplayer drawing and guessing game inspired by the classic Pictionary. Players take turns drawing a given word while others try to guess it. The application features:

- Real-time drawing synchronization
- Room-based multiplayer gameplay
- Google authentication
- Score tracking and leaderboards
- Customizable game settings

The application is built using:
- Next.js (React) for the frontend
- Socket.IO for real-time communication
- Node.js for the backend socket server
- Firebase for authentication and data storage
- Tailwind CSS for styling

## Project Structure

The PictoBlitz project is organized into two main components:

1. **Client Application** (`/pictoblitz`)
   - Next.js application with React components
   - Client-side Socket.IO integration
   - Firebase authentication and data handling

2. **Socket Server** (`/pictoblitz/socket-server`)
   - Node.js server with Express
   - Socket.IO server implementation
   - Game state management
   - Real-time event handling

## Getting Started

To set up the project locally, follow the instructions in the [Application Usage Guide](./3_Application_Usage.md).