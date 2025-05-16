"use client";

import Image from "next/image";
import Link from 'next/link'

import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    // Check localStorage first to prevent flickering
    const cachedUser = localStorage.getItem("firebaseUser");
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Cache the user in localStorage
        localStorage.setItem("firebaseUser", JSON.stringify(currentUser));
        setUser(currentUser);
      } else {
        // Clear cache if signed out
        localStorage.removeItem("firebaseUser");
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the user info
      const user = result.user;
      console.log("User signed in:", user);
      
      // Store the auth token
      localStorage.setItem("authToken", user.accessToken);
      
      // Set user state
      setUser(user);
      
      // Redirect to rooms page
      // router.push('/rooms');
    } catch (error) {
      console.error("Error signing in:", error);
      alert("Failed to sign in: " + error.message);
    }
  }

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.removeItem("firebaseUser"); // Clear cache on sign-out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    // <div className="grid grid-rows-[20px_1fr_20px]items-center justify-items-center min-h-screen bg-black p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <div className="min-h-screen flex flex-col bg-blue-50">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center text-2xl font-bold">
            <span className="text-3xl mr-2">
              <i className="fas fa-paint-brush"></i>
            </span>
            Pictoblitz
          </div>
          <div className="flex space-x-4">
          <>
              {!user ? (
                <button
                  onClick={handleSignIn}
                  className="px-4 py-2 rounded-full bg-white text-teal-700 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  Sign in
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              )}
            </>
            <Link href="/profile">
              <button className="px-4 py-2 rounded-full bg-white text-teal-700 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                Profile
              </button>
            </Link>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
              Welcome to Pictoblitz!
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Draw, guess, and laugh in this fast-paced multiplayer pictionary game
            </p>
          </div>

          {/* Main Actions */}
          <div className="w-full max-w-md space-y-16 mb-16">
          <Link href="/rooms">
            <button 
              className="w-full px-6 py-5 text-xl font-semibold bg-red-500 text-white rounded-xl shadow-lg flex justify-between items-center hover:bg-red-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              Play Multiplayer
              <span className="text-2xl">
                <i className="fas fa-users"></i>
              </span>
            </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
