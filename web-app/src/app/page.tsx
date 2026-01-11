'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MotionTracker } from '@/lib/motionTracker';
import { useAppStore } from '@/lib/store';
import ObjectRegistration from '@/components/ObjectRegistration';
import MappingConfigurator from '@/components/MappingConfigurator';
import { DetectedObject, MotionEvent } from '@/types';

export default function HapticController() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionTrackerRef = useRef<MotionTracker | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'setup' | 'control'>('setup');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  
  const { 
    objects, 
    setObjects,
    isTracking, 
    setTracking,
    mappings,
    isConnected,
    setConnected,
    desktopConnected,
    setDesktopConnected
  } = useAppStore();

  // Visual feedback function - defined first as it's used by other hooks
  const animateCommand = useCallback((cmd: { action: string; value: number }) => {
    const feedback = document.createElement('div');
    feedback.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg animate-pulse z-50';
    feedback.textContent = `${cmd.action}: ${cmd.value}`;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }, []);

  // Process motion events - defined early as it's used by trackMotion
  const processMotionEvent = useCallback(async (event: MotionEvent) => {
    const mappingKey = `${event.objectLabel}:${event.gesture}`;
    const command = mappings[mappingKey];

    if (!command) return;

    try {
      const response = await fetch('/api/interpret-gesture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motionEvent: event,
          userMapping: command
        })
      });

      if (response.ok) {
        const interpretation = await response.json();
        socketRef.current?.emit('gesture_interpreted', interpretation);
        setLastCommand(`${interpretation.command.action}: ${interpretation.command.value}`);
      }
    } catch (error) {
      console.error('Failed to interpret gesture:', error);
    }
  }, [mappings]);

  // Initialize motion tracker
  useEffect(() => {
    motionTrackerRef.current = new MotionTracker();
    return () => {
      motionTrackerRef.current?.reset();
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });

    socketRef.current.on('desktop_connected', () => {
      setDesktopConnected(true);
    });

    socketRef.current.on('desktop_disconnected', () => {
      setDesktopConnected(false);
    });

    socketRef.current.on('motion_command', (cmd) => {
      setLastCommand(`${cmd.action}: ${cmd.value}`);
      animateCommand(cmd);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [setConnected, setDesktopConnected, animateCommand]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setTracking(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [setTracking]);

  const trackMotion = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !motionTrackerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const trackFrame = async () => {
      if (!isTracking) return;

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (objects.length > 0) {
        const motionEvents = motionTrackerRef.current!.computeMotion(imageData, objects);

        for (const event of motionEvents) {
          await processMotionEvent(event);
        }
      }

      animationFrameRef.current = requestAnimationFrame(trackFrame);
    };

    trackFrame();
  }, [isTracking, objects, processMotionEvent]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;

    await startCamera();
    setTracking(true);

    await new Promise(resolve => {
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => resolve(true);
      }
    });

    trackMotion();
  }, [startCamera, setTracking, trackMotion]);

  const handleObjectsDetected = useCallback((detectedObjects: DetectedObject[]) => {
    setObjects(detectedObjects);
  }, [setObjects]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Haptic Desktop Controller
          </h1>
          <p className="text-gray-400 mt-2">
            Control your desktop using everyday objects
          </p>
        </header>

        {/* Connection Status */}
        <div className="flex gap-4 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            Server: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            desktopConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${desktopConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            Desktop: {desktopConnected ? 'Connected' : 'Waiting...'}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'setup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📷 Setup
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'control'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🎮 Control
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === 'setup' ? (
            <>
              {/* Object Registration */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">1. Detect Objects</h2>
                  <ObjectRegistration onObjectsDetected={handleObjectsDetected} />
                </div>
              </div>

              {/* Mapping Configuration */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">2. Configure Mappings</h2>
                  <MappingConfigurator objects={objects} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Live Camera Feed */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">Live Tracking</h2>
                  <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!isTracking && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                        <p className="text-gray-400">Click &quot;Start Tracking&quot; to begin</p>
                      </div>
                    )}
                    {isTracking && (
                      <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        ● LIVE
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    {!isTracking ? (
                      <button
                        onClick={startTracking}
                        disabled={objects.length === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
                      >
                        ▶️ Start Tracking
                      </button>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                      >
                        ⏹️ Stop Tracking
                      </button>
                    )}
                  </div>

                  {objects.length === 0 && (
                    <p className="text-yellow-400 text-sm mt-3">
                      ⚠️ No objects detected. Go to Setup tab to detect objects first.
                    </p>
                  )}
                </div>
              </div>

              {/* Control Panel */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">Status</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Tracked Objects</p>
                      <p className="text-2xl font-bold">{objects.length}</p>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Active Mappings</p>
                      <p className="text-2xl font-bold">{Object.keys(mappings).length}</p>
                    </div>

                    {lastCommand && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-sm text-green-400">Last Command</p>
                        <p className="text-lg font-medium text-green-300">{lastCommand}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Object List */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Detected Objects</h3>
                    <div className="space-y-2">
                      {objects.map((obj, i) => (
                        <div 
                          key={i}
                          className="bg-gray-900/50 rounded px-3 py-2 text-sm flex justify-between items-center"
                        >
                          <span className="capitalize">{obj.label}</span>
                          <span className="text-xs text-blue-400">{obj.affordance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Powered by Gemini Robotics-ER 1.5 • Built with Next.js</p>
        </footer>
      </div>
    </main>
  );
}
