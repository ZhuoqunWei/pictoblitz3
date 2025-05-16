"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  initializeSocket, 
  getAvailableRooms, 
  createRoom, 
  joinRoom, 
  subscribeToErrors 
} from "@/lib/socketService";

export default function Rooms() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [maxRounds, setMaxRounds] = useState(3);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    // Initialize socket connection
    initializeSocket();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        // Redirect to home if not logged in
        router.push('/');
      }
    });
    
    // Subscribe to socket errors
    const unsubscribeErrors = subscribeToErrors((error) => {
      console.error("Socket error:", error);
      setError(error.message || "Something went wrong");
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, [router]);

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  const loadRooms = async () => {
    if (!user) return;
    
    try {
      const availableRooms = await getAvailableRooms();
      setRooms(availableRooms);
    } catch (error) {
      console.error("Error loading rooms:", error);
      setError("Failed to load available rooms");
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!newRoomName.trim()) {
      setError("Room name cannot be empty");
      return;
    }
    
    try {
      setCreatingRoom(true);
      const { roomId } = await createRoom({
        roomName: newRoomName,
        maxPlayers,
        maxRounds,
        user: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        }
      });
      
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setError("Failed to create room: " + (error.message || "Unknown error"));
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      setJoiningRoom(true);
      await joinRoom(roomId, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      setError("Failed to join room: " + (error.message || "Unknown error"));
    } finally {
      setJoiningRoom(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-blue-50">
      <header className="bg-teal-700 text-white shadow-md mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center text-2xl font-bold">
            <Link href="/">
              <span className="text-3xl mr-2">
                <i className="fas fa-paint-brush"></i>
              </span>
              Pictoblitz
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4">

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-6">
            {error}
            <button 
              className="ml-2 font-bold" 
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Room */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label htmlFor="roomName" className="block text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter room name"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="maxPlayers" className="block text-gray-700 mb-2">
                  Max Players
                </label>
                <select
                  id="maxPlayers"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} players</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="maxRounds" className="block text-gray-700 mb-2">
                  Number of Rounds
                </label>
                <select
                  id="maxRounds"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} round{num !== 1 && 's'}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={creatingRoom}
                className="w-full bg-teal-600 text-white font-medium py-2 px-4 rounded-md hover:bg-teal-700 transition-all disabled:bg-gray-400"
              >
                {creatingRoom ? "Creating..." : "Create Room"}
              </button>
            </form>
          </div>

          {/* Available Rooms */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Available Rooms</h2>
              <button
                onClick={loadRooms}
                className="text-teal-600 hover:text-teal-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {rooms.length > 0 ? (
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800">{room.name}</h3>
                        <p className="text-sm text-gray-500">
                          Host: {room.hostName} • {room.players}/{room.maxPlayers} players
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={joiningRoom}
                        className="bg-teal-600 text-white font-medium py-1 px-3 rounded-md hover:bg-teal-700 transition-all disabled:bg-gray-400"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No rooms available</p>
                <p className="text-sm">Create a room to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}