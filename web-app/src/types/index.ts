// Type definitions for Haptic Desktop Controller

export interface DetectedObject {
  point: [number, number]; // [y, x] normalized to 0-1000
  label: string;
  affordance: 'rotation' | 'translation' | 'press';
}

export type Gesture = 
  | 'subtle' 
  | 'right' 
  | 'left' 
  | 'up' 
  | 'down' 
  | 'rotate_cw' 
  | 'rotate_ccw'
  | 'unknown';

export interface MotionEvent {
  objectLabel: string;
  affordance: 'rotation' | 'translation' | 'press';
  gesture: Gesture;
  deltaX: number;
  deltaY: number;
  magnitude: number;
  timestamp: number;
}

export interface GestureInterpretation {
  gesture_type: string;
  rotation_angle?: number;
  intensity: number;
  command: {
    action: string;
    value: number;
    direction?: string;
  };
}

export interface ObjectMapping {
  objectLabel: string;
  gesture: string;
  command: string;
}

export interface UserMappings {
  [key: string]: string; // "object:gesture" -> "command"
}
