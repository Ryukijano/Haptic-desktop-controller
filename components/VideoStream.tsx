"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";

interface VideoStreamProps {
  onGestureDetected: (gesture: string) => void;
  registeredObjects: string[];
}

interface DetectedObject {
  label: string;
  x: number;
  y: number;
  confidence: number;
}

export default function VideoStream({ onGestureDetected, registeredObjects }: VideoStreamProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [fps, setFps] = useState(0);

  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current || isProcessing) return;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.warn("Failed to capture screenshot - webcam may not be ready");
        return;
      }

      setIsProcessing(true);
      const startTime = performance.now();

      try {
        const response = await fetch("/api/detect-objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            image: imageSrc,
            registeredObjects 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDetectedObjects(data.objects || []);
          
          // Interpret gestures based on object positions
          if (data.objects && data.objects.length > 0) {
            const gesture = interpretGesture(data.objects);
            if (gesture) {
              onGestureDetected(gesture);
            }
          }
        }

        const endTime = performance.now();
        setFps(Math.round(1000 / (endTime - startTime)));
      } catch (error) {
        console.error("Detection error:", error);
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Webcam capture error:", error);
    }
  }, [isProcessing, registeredObjects, onGestureDetected]);

  const interpretGesture = (objects: DetectedObject[]): string => {
    // Simple gesture interpretation logic
    if (objects.length === 0) return "";
    
    const hand = objects.find(obj => obj.label.toLowerCase().includes("hand"));
    if (!hand) return "";

    // Gesture interpretation based on hand position
    if (hand.y < 0.3) return "scroll_up";
    if (hand.y > 0.7) return "scroll_down";
    if (hand.x < 0.3) return "volume_down";
    if (hand.x > 0.7) return "volume_up";
    
    return "idle";
  };

  useEffect(() => {
    const interval = setInterval(captureAndDetect, 500); // Process every 500ms
    return () => clearInterval(interval);
  }, [captureAndDetect]);

  // Draw tracking overlay
  useEffect(() => {
    if (!canvasRef.current || !webcamRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = webcamRef.current.video;
    if (!video) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detected objects
    detectedObjects.forEach((obj) => {
      const x = obj.x * canvas.width;
      const y = obj.y * canvas.height;
      const size = 20;

      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = "#00ff00";
      ctx.font = "14px Arial";
      ctx.fillText(`${obj.label} (${Math.round(obj.confidence * 100)}%)`, x + 25, y);
    });
  }, [detectedObjects]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Video Stream
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          FPS: {fps} | Objects: {detectedObjects.length}
        </div>
      </div>
      
      <div className="relative rounded-lg overflow-hidden bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        {isProcessing && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            Processing...
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Motion tracking active. Registered objects will be highlighted.</p>
      </div>
    </div>
  );
}
