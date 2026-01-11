'use client';

import { useRef, useState, useCallback } from 'react';
import { DetectedObject } from '@/types';
import { useAppStore } from '@/lib/store';

interface ObjectRegistrationProps {
  onObjectsDetected?: (objects: DetectedObject[]) => void;
}

export default function ObjectRegistration({ onObjectsDetected }: ObjectRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const { setObjects } = useAppStore();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  const captureFrame = async () => {
    if (!videoRef.current || !cameraActive) {
      setError('Camera is not active');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      );
      
      if (!blob) throw new Error('Failed to create image blob');

      // Send to backend for object detection
      const response = await fetch('/api/detect-objects', {
        method: 'POST',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect objects');
      }

      const data = await response.json();
      setObjects(data.objects);
      onObjectsDetected?.(data.objects);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Camera View */}
      <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          autoPlay 
          playsInline
          muted
        />
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <p className="text-gray-400">Camera not active</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            📷 Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={captureFrame}
              disabled={isCapturing}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isCapturing ? '⏳ Detecting...' : '🎯 Detect Objects'}
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              ⏹️ Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
