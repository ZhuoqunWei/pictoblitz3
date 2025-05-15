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
    <div className="grid grid-rows-[20px_1fr_20px]items-center justify-items-center min-h-screen bg-black p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <div>
          <h1 className="mt-64 text-teal-600 text-8xl p-4 mt-24 relative">Pictoblitz</h1>

          <div className="absolute top-10 right-5 justify-center">
            <div className="flex flex-row gap-10">
            <>
              {!user ? (
                <button
                  onClick={handleSignIn}
                  className="flex items-center justify-center gap-2 bg-teal-700 text-white font-medium py-2 px-4 rounded-md border border-gray-300 hover:shadow-md transition-all hover:scale-105"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    {/* Google logo paths */}
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Login with Google
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white font-medium py-2 px-4 rounded-md hover:shadow-md transition-all hover:scale-105"
                >
                  Sign Out
                </button>
              )}
            </>
              <Link href="/profile">
              <button className="flex items-center justify-center gap-2 bg-teal-700 text-white font-medium py-2 px-4 rounded-md border border-gray-300 hover:shadow-md transition-all hover:scale-105">Profile</button>
              </Link>
            </div>

          </div>

          <div className="flex flex-col mt-20 gap-10 justify-center items-center">
            <Link href="/rooms">
              <button className="flex items-center justify-center gap-2 bg-teal-700 text-white font-medium py-2 px-4 rounded-md border border-gray-300 hover:shadow-md transition-all hover:scale-105">Play Multiplayer</button>
            </Link>
            <Link href="/canvas">
              <button className="flex items-center justify-center gap-2 bg-teal-700 text-white font-medium py-2 px-4 rounded-md border border-gray-300 hover:shadow-md transition-all hover:scale-105">Practice Drawing</button>
            </Link>
          </div>





        </div>
    </div>
  );
}
