"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {


  return (
    <>
    <div className="h-[100vh] w-[100vw] bg-black">
        <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div class="bg-teal-600 h-32"></div>
            <div class="px-6 py-4 flex items-center">
                <div class="relative -mt-16">
                    <div class="h-24 w-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                        <span class="text-3xl text-gray-500">JD</span>
                    </div>
                </div>
                <div class="ml-6">
                    <h1 class="text-2xl font-bold text-gray-800">Johnny Dinh</h1>
                    <p class="text-gray-600">Member since January 2025</p>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <h3 class="text-gray-500 text-sm font-medium">Games Played</h3>
                <p class="text-3xl font-bold text-black">5</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <h3 class="text-gray-500 text-sm font-medium">Wins</h3>
                <p class="text-3xl font-bold text-black">3</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6 text-center">
                <h3 class="text-gray-500 text-sm font-medium">Medals</h3>
                <p class="text-3xl font-bold text-black">1</p>
            </div>
        </div>
    </div>

    </>
  );
}

