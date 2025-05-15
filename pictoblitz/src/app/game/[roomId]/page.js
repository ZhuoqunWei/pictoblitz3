"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  initializeSocket,
  joinRoom,
  leaveRoom,
  startGame,
  nextRound,
  submitGuess,
  sendDrawingData,
  clearCanvas,
  subscribeToRoomUpdates,
  subscribeToGameStarted,
  subscribeToRoundStarted,
  subscribeToGameOver,
  subscribeToDrawingUpdates,
  subscribeToCanvasCleared,
  subscribeToNewMessages,
  subscribeToCorrectGuess,
  subscribeToRoomDeleted,
  subscribeToErrors,
  subscribeToRoundTimeUp
} from "@/lib/socketService";

export default function Game() {
  const { roomId } = useParams();
  const router = useRouter();
  const canvasRef = useRef(null);
  const prevPoint = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentLineWidth, setCurrentLineWidth] = useState(5);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [messages, setMessages] = useState([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  
  const messagesEndRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Authentication check
  useEffect(() => {
    // Initialize socket
    initializeSocket();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        router.push('/');
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  // Join room and subscribe to updates
  useEffect(() => {
    if (!user || !roomId) return;
    
    const userInfo = {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    };

    // Join the room
    const joinAndSubscribe = async () => {
      try {
        await joinRoom(roomId, userInfo);
        
        // Subscribe to all necessary events
        const unsubscribeRoom = subscribeToRoomUpdates((updatedRoom) => {
          setRoom(updatedRoom);
        });
        
        const unsubscribeGameStarted = subscribeToGameStarted((gameData) => {
          setRoom(gameData);
          setFeedback("Game started!");
          // Clear canvas for a new game
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          
          // Start the timer
          setTimeLeft(90);
          setTimerActive(true);
          startTimer();
        });
        
        const unsubscribeRoundStarted = subscribeToRoundStarted((gameData) => {
          setRoom(gameData);
          setFeedback(`Round ${gameData.currentRound} started!`);
          // Clear canvas for a new round
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          
          // Reset and start the timer
          setTimeLeft(90);
          setTimerActive(true);
          startTimer();
        });
        
        const unsubscribeGameOver = subscribeToGameOver((gameData) => {
          setRoom(gameData);
          setFeedback("Game over!");
          setTimerActive(false);
          clearInterval(timerIntervalRef.current);
        });
        
        const unsubscribeDrawing = subscribeToDrawingUpdates((drawingData) => {
          if (!isDrawer && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            
            // Draw the received line
            ctx.beginPath();
            ctx.moveTo(drawingData.startX, drawingData.startY);
            ctx.lineTo(drawingData.endX, drawingData.endY);
            ctx.strokeStyle = drawingData.color;
            ctx.lineWidth = drawingData.width;
            ctx.lineCap = "round";
            ctx.stroke();
          }
        });
        
        const unsubscribeCanvasClear = subscribeToCanvasCleared(() => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        });
        
        const unsubscribeMessages = subscribeToNewMessages((message) => {
          setMessages(prev => [...prev, message]);
        });
        
        const unsubscribeCorrectGuess = subscribeToCorrectGuess(({ guesserId, drawerId, room }) => {
          setRoom(room);
          if (guesserId === user.uid) {
            setFeedback("Correct! You guessed the word!");
          } else if (drawerId === user.uid) {
            setFeedback("Someone guessed your word!");
          }
        });
        
        const unsubscribeRoomDeleted = subscribeToRoomDeleted(() => {
          setFeedback("The room was deleted");
          router.push('/rooms');
        });
        
        const unsubscribeErrors = subscribeToErrors((error) => {
          console.error("Socket error:", error);
          setFeedback(error.message || "An error occurred");
        });
        
        const unsubscribeRoundTimeUp = subscribeToRoundTimeUp(({ word }) => {
          setFeedback(`Time's up! The word was: ${word}`);
          setTimerActive(false);
          clearInterval(timerIntervalRef.current);
        });
        
        // Cleanup subscriptions
        return () => {
          unsubscribeRoom();
          unsubscribeGameStarted();
          unsubscribeRoundStarted();
          unsubscribeGameOver();
          unsubscribeDrawing();
          unsubscribeCanvasClear();
          unsubscribeMessages();
          unsubscribeCorrectGuess();
          unsubscribeRoomDeleted();
          unsubscribeErrors();
          unsubscribeRoundTimeUp();
          clearInterval(timerIntervalRef.current);
          leaveRoom(roomId, userInfo);
        };
      } catch (error) {
        console.error("Error joining room:", error);
        setFeedback("Error joining room");
        router.push('/rooms');
      }
    };
    
    joinAndSubscribe();
  }, [user, roomId, router]);
  
  // Update isDrawer status when room changes
  useEffect(() => {
    if (room && user) {
      setIsDrawer(room.currentDrawer === user.uid);
    }
  }, [room, user]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Set canvas background to white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  // Drawing event handlers
  useEffect(() => {
    if (!isDrawer || !roomId) return;
    
    const handler = (e) => {
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
    
    const handleMouseUp = () => {
      setMouseDown(false);
      prevPoint.current = null;
    };
    
    canvasRef.current?.addEventListener("mousemove", handler);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      canvasRef.current?.removeEventListener("mousemove", handler);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseDown, currentColor, currentLineWidth, roomId, isDrawer]);

  // Timer function
  const startTimer = () => {
    // Clear existing interval if any
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Start new interval
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Helper functions
  const getCurrentPosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    // Account for scaling by calculating the ratio between logical and displayed sizes
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Apply the scaling to get accurate coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const drawLine = (ctx, start, end, color, width) => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  // Event handlers
  const handleStartGame = () => {
    startGame(roomId, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
  };

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    
    if (!guess.trim()) return;
    
    submitGuess(roomId, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    }, guess);
    
    setGuess("");
  };

  const handleNextRound = () => {
    nextRound(roomId);
  };

  const handleClearCanvas = () => {
    if (!isDrawer) return;
    
    clearCanvas(roomId);
    
    // Clear local canvas
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom(roomId, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    router.push('/rooms');
  };

  if (loading || !room) {
    return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/">
            <h1 className="text-teal-600 text-2xl font-bold">Pictoblitz</h1>
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 text-white font-medium py-1 px-3 rounded-md hover:bg-red-700 transition-all"
            >
              Leave Room
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{room.name}</h2>
            <div className="text-sm text-gray-500">
              Round {room.currentRound}/{room.maxRounds} • {room.players.length}/{room.maxPlayers} players
            </div>
          </div>
        </div>

        {room.status === 'waiting' ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Waiting for players</h2>
              <div className="mb-6">
                <p className="text-gray-600">Players in room:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {room.players.map(player => (
                    <div 
                      key={player.id} 
                      className="flex items-center gap-2 bg-gray-100 p-2 rounded-md"
                    >
                      {player.photoURL && (
                        <img 
                          src={player.photoURL} 
                          alt={player.name} 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>{player.name}</span>
                      {player.isHost && (
                        <span className="text-xs bg-teal-100 text-teal-800 px-1 rounded">Host</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {room.players.find(p => p.id === user?.uid)?.isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={room.players.length < 2}
                  className="bg-teal-600 text-white font-medium py-2 px-6 rounded-md hover:bg-teal-700 transition-all disabled:bg-gray-400"
                >
                  Start Game
                </button>
              ) : (
                <div className="text-gray-600">Waiting for host to start the game...</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Game status */}
            <div className="md:col-span-3 bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Current Drawer:</span>{" "}
                  {room.players.find(p => p.id === room.currentDrawer)?.name || "Unknown"}
                </div>
                <div className="flex items-center gap-4">
                  {timerActive && (
                    <div className={`flex items-center font-bold text-lg ${timeLeft <= 10 ? 'text-red-600' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {timeLeft}s
                    </div>
                  )}
                  {isDrawer && (
                    <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-md">
                      Your word: <span className="font-bold">{room.currentWord}</span>
                    </div>
                  )}
                  {feedback && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md">
                      {feedback}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Left column - Canvas */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full border border-gray-300 rounded"
                    onMouseDown={() => isDrawer && setMouseDown(true)}
                    style={{ touchAction: "none" }}
                  />
                  
                  {isDrawer && (
                    <div className="absolute bottom-2 left-2 flex gap-2 bg-white p-2 rounded-md shadow-md">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={e => setCurrentColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer"
                      />
                      <select
                        value={currentLineWidth}
                        onChange={e => setCurrentLineWidth(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2"
                      >
                        <option value={2}>Thin</option>
                        <option value={5}>Medium</option>
                        <option value={10}>Thick</option>
                        <option value={15}>Very Thick</option>
                      </select>
                      <button
                        onClick={handleClearCanvas}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - Chat and players */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h3 className="font-bold mb-2">Players</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {room.players
                    .sort((a, b) => b.score - a.score) // Sort by score
                    .map(player => (
                      <div 
                        key={player.id} 
                        className={`flex justify-between items-center p-2 rounded ${player.id === room.currentDrawer ? 'bg-teal-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {player.photoURL && (
                            <img 
                              src={player.photoURL} 
                              alt={player.name} 
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className={player.id === user?.uid ? 'font-medium' : ''}>
                            {player.name}
                            {player.id === room.currentDrawer && (
                              <span className="ml-1 text-xs text-teal-600">(Drawing)</span>
                            )}
                          </span>
                        </div>
                        <span className="font-medium">{player.score}</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 h-96 flex flex-col">
                <h3 className="font-bold mb-2">Chat</h3>
                <div className="flex-1 overflow-y-auto mb-2 space-y-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-2 rounded-md ${msg.isCorrect ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
                    >
                      <span className="font-medium">{msg.sender}: </span>
                      <span>{msg.content}</span>
                      {msg.isCorrect && <span className="ml-2 text-xs">✓ Correct!</span>}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {!isDrawer && room.status === 'active' && (
                  <form onSubmit={handleSubmitGuess} className="flex gap-2">
                    <input
                      type="text"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder="Type your guess..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      disabled={isDrawer}
                    />
                    <button
                      type="submit"
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-all"
                    >
                      Send
                    </button>
                  </form>
                )}
                {isDrawer && room.status === 'active' && (
                  <div className="mt-auto">
                    <button
                      onClick={handleNextRound}
                      className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-all"
                    >
                      Next Round
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {room.status === 'completed' && (
          <div className="mt-4 bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-lg mb-2">Final Scores</h3>
              <div className="space-y-2">
                {room.players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex justify-between items-center p-3 rounded-md ${index === 0 ? 'bg-yellow-100' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 && <span>🏆</span>}
                        {player.photoURL && (
                          <img 
                            src={player.photoURL} 
                            alt={player.name} 
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="font-bold">{player.score} pts</span>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => router.push('/rooms')}
                className="mt-6 bg-teal-600 text-white font-medium py-2 px-6 rounded-md hover:bg-teal-700 transition-all"
              >
                Back to Rooms
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}