"use client";

import { useState } from "react";
import VideoStream from "@/components/VideoStream";
import ObjectRegistration from "@/components/ObjectRegistration";
import GestureDisplay from "@/components/GestureDisplay";

export default function Home() {
  const [registeredObjects, setRegisteredObjects] = useState<string[]>([]);
  const [currentGesture, setCurrentGesture] = useState<string>("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Haptic Desktop Controller
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Stream with Motion Tracking */}
          <div className="lg:col-span-2">
            <VideoStream 
              onGestureDetected={setCurrentGesture}
              registeredObjects={registeredObjects}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Object Registration */}
            <ObjectRegistration 
              registeredObjects={registeredObjects}
              onRegisterObject={(obj) => setRegisteredObjects([...registeredObjects, obj])}
              onRemoveObject={(obj) => setRegisteredObjects(registeredObjects.filter(o => o !== obj))}
            />

            {/* Gesture Display */}
            <GestureDisplay currentGesture={currentGesture} />
          </div>
        </div>
      </main>
    </div>
  );
}
