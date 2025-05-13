// Firestore service for PictoBlitz multiplayer game
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  arrayUnion, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Collection references
const ROOMS_COLLECTION = 'rooms';
const DRAWINGS_COLLECTION = 'drawings';
const PLAYERS_COLLECTION = 'players';

/**
 * Create a new game room
 * @param {string} roomName - Name of the room
 * @param {number} maxPlayers - Maximum number of players (default: 8)
 * @returns {Promise<string>} - Room ID
 */
export const createRoom = async (roomName, maxPlayers = 8, maxRounds = 3) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const roomRef = collection(db, ROOMS_COLLECTION);
    
    const roomData = {
      name: roomName,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      hostName: user.displayName || 'Anonymous',
      hostPhotoURL: user.photoURL || '',
      status: 'waiting', // waiting, active, completed
      maxPlayers,
      currentRound: 0,
      maxRounds,
      currentDrawer: '',
      currentWord: '',
      players: [
        {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '',
          score: 0,
          isHost: true,
          joinedAt: new Date().toISOString()
        }
      ]
    };
    
    const newRoomRef = await addDoc(roomRef, roomData);
    return newRoomRef.id;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

/**
 * Join an existing game room
 * @param {string} roomId - Room ID to join
 * @returns {Promise<void>}
 */
export const joinRoom = async (roomId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnapshot.data();
    
    // Check if room is full
    if (roomData.players.length >= roomData.maxPlayers) {
      throw new Error('Room is full');
    }
    
    // Check if player is already in the room
    const existingPlayer = roomData.players.find(player => player.id === user.uid);
    if (existingPlayer) {
      return; // Player is already in the room
    }
    
    // Add player to the room
    await updateDoc(roomRef, {
      players: arrayUnion({
        id: user.uid,
        name: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        score: 0,
        isHost: false,
        joinedAt: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

/**
 * Leave a game room
 * @param {string} roomId - Room ID to leave
 * @returns {Promise<void>}
 */
export const leaveRoom = async (roomId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnapshot.data();
    
    // Remove player from the room
    const updatedPlayers = roomData.players.filter(player => player.id !== user.uid);
    
    if (updatedPlayers.length === 0) {
      // If last player is leaving, delete the room
      await deleteDoc(roomRef);
      return;
    }
    
    // Check if leaving player is the host
    const isHost = roomData.players.find(player => player.id === user.uid)?.isHost;
    
    if (isHost && updatedPlayers.length > 0) {
      // Assign a new host
      updatedPlayers[0].isHost = true;
    }
    
    await updateDoc(roomRef, { players: updatedPlayers });
  } catch (error) {
    console.error('Error leaving room:', error);
    throw error;
  }
};

/**
 * Get available rooms
 * @returns {Promise<Array>} - List of available rooms
 */
export const getAvailableRooms = async () => {
  try {
    const roomsQuery = query(
      collection(db, ROOMS_COLLECTION),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    );
    
    const roomsSnapshot = await getDocs(roomsQuery);
    const rooms = [];
    
    roomsSnapshot.forEach(doc => {
      const roomData = doc.data();
      rooms.push({
        id: doc.id,
        ...roomData,
        players: roomData.players.length,
        maxPlayers: roomData.maxPlayers
      });
    });
    
    return rooms;
  } catch (error) {
    console.error('Error getting available rooms:', error);
    throw error;
  }
};

/**
 * Get room details
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} - Room details
 */
export const getRoomDetails = async (roomId) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    return {
      id: roomSnapshot.id,
      ...roomSnapshot.data()
    };
  } catch (error) {
    console.error('Error getting room details:', error);
    throw error;
  }
};

/**
 * Subscribe to room updates
 * @param {string} roomId - Room ID to subscribe to
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

/**
 * Save drawing data
 * @param {string} roomId - Room ID
 * @param {Object} drawingData - Drawing data
 * @returns {Promise<void>}
 */
export const saveDrawingData = async (roomId, drawingData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const drawingRef = doc(db, ROOMS_COLLECTION, roomId, DRAWINGS_COLLECTION, 'current');
    
    await setDoc(drawingRef, {
      ...drawingData,
      timestamp: serverTimestamp(),
      drawerId: user.uid
    });
  } catch (error) {
    console.error('Error saving drawing data:', error);
    throw error;
  }
};

/**
 * Subscribe to drawing updates
 * @param {string} roomId - Room ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToDrawing = (roomId, callback) => {
  const drawingRef = doc(db, ROOMS_COLLECTION, roomId, DRAWINGS_COLLECTION, 'current');
  return onSnapshot(drawingRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};

/**
 * Start the game
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
export const startGame = async (roomId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnapshot.data();
    
    // Check if user is the host
    const isHost = roomData.players.find(player => player.id === user.uid)?.isHost;
    if (!isHost) {
      throw new Error('Only the host can start the game');
    }
    
    // Check if enough players
    if (roomData.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    
    // Select first drawer randomly
    const randomIndex = Math.floor(Math.random() * roomData.players.length);
    const firstDrawer = roomData.players[randomIndex].id;
    
    // Simple word list (expand this later)
    const words = ['apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'giraffe', 'house'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    await updateDoc(roomRef, {
      status: 'active',
      currentRound: 1,
      currentDrawer: firstDrawer,
      currentWord: randomWord,
      gameStartedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

/**
 * Submit a guess
 * @param {string} roomId - Room ID
 * @param {string} guess - Player's guess
 * @returns {Promise<boolean>} - Whether the guess was correct
 */
export const submitGuess = async (roomId, guess) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnapshot.data();
    
    // Check if player is the current drawer
    if (roomData.currentDrawer === user.uid) {
      throw new Error('The drawer cannot guess');
    }
    
    // Check if the guess is correct
    const isCorrect = guess.toLowerCase().trim() === roomData.currentWord.toLowerCase();
    
    if (isCorrect) {
      // Update player score
      const updatedPlayers = roomData.players.map(player => {
        if (player.id === user.uid) {
          // Guesser gets points
          return { ...player, score: player.score + 100 };
        } 
        if (player.id === roomData.currentDrawer) {
          // Drawer gets points too
          return { ...player, score: player.score + 50 };
        }
        return player;
      });
      
      await updateDoc(roomRef, { players: updatedPlayers });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error submitting guess:', error);
    throw error;
  }
};

/**
 * Move to next round or end game
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
export const nextRound = async (roomId) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnapshot.data();
    
    if (roomData.currentRound >= roomData.maxRounds) {
      // End game
      await updateDoc(roomRef, {
        status: 'completed',
        gameEndedAt: serverTimestamp()
      });
      return;
    }
    
    // Find next drawer
    const currentDrawerIndex = roomData.players.findIndex(player => player.id === roomData.currentDrawer);
    const nextDrawerIndex = (currentDrawerIndex + 1) % roomData.players.length;
    const nextDrawer = roomData.players[nextDrawerIndex].id;
    
    // Select new word
    const words = ['apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'giraffe', 'house'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    await updateDoc(roomRef, {
      currentRound: roomData.currentRound + 1,
      currentDrawer: nextDrawer,
      currentWord: randomWord
    });
    
    // Clear the current drawing
    const drawingRef = doc(db, ROOMS_COLLECTION, roomId, DRAWINGS_COLLECTION, 'current');
    await setDoc(drawingRef, { lines: [] });
  } catch (error) {
    console.error('Error moving to next round:', error);
    throw error;
  }
};