"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        // Redirect to home if not logged in
        router.push('/');
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      localStorage.removeItem("firebaseUser"); // Clear cache on sign-out

      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  return (
    <>
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
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={handleSignOut}
            className="bg-teal-700 text-white font-medium py-2 px-4 rounded-md hover:bg-teal-800 transition-all"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-teal-600 h-32"></div>
            <div className="px-6 py-4 flex items-center">
                <div className="relative -mt-16">
                    <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="text-3xl text-gray-500">
                            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                          </span>
                        )}
                    </div>
                </div>
                <div className="ml-6">
                    <h1 className="text-2xl font-bold text-gray-800">{user?.displayName || "User"}</h1>
                    <p className="text-gray-600">{user?.email}</p>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-gray-500 text-sm font-medium">Games Played</h3>
                <p className="text-3xl font-bold text-black">5</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-gray-500 text-sm font-medium">Wins</h3>
                <p className="text-3xl font-bold text-black">3</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-gray-500 text-sm font-medium">Medals</h3>
                <p className="text-3xl font-bold text-black">1</p>
            </div>
        </div>
      </div>
    </div>
    </>
  );
}

