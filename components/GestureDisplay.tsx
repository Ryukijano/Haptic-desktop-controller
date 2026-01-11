"use client";

interface GestureDisplayProps {
  currentGesture: string;
}

const gestureIcons: Record<string, string> = {
  scroll_up: "↑",
  scroll_down: "↓",
  volume_up: "🔊",
  volume_down: "🔉",
  idle: "✋",
};

const gestureLabels: Record<string, string> = {
  scroll_up: "Scroll Up",
  scroll_down: "Scroll Down",
  volume_up: "Volume Up",
  volume_down: "Volume Down",
  idle: "Idle",
};

export default function GestureDisplay({ currentGesture }: GestureDisplayProps) {
  const icon = gestureIcons[currentGesture] || "❓";
  const label = gestureLabels[currentGesture] || "No Gesture";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Real-time Gesture
      </h2>

      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-6xl mb-4">{icon}</div>
        <div className="text-2xl font-medium text-gray-800 dark:text-white">
          {label}
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium">Available Gestures:</p>
        <ul className="space-y-1 pl-4">
          <li>• Hand at top → Scroll Up</li>
          <li>• Hand at bottom → Scroll Down</li>
          <li>• Hand on left → Volume Down</li>
          <li>• Hand on right → Volume Up</li>
        </ul>
      </div>
    </div>
  );
}
