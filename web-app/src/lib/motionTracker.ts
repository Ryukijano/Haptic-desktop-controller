import { DetectedObject, MotionEvent, Gesture } from '@/types';

/**
 * MotionTracker class for computing optical flow and gesture classification
 * between consecutive frames for object motion detection.
 */
export class MotionTracker {
  private previousPoints: Map<string, [number, number]> = new Map();
  private frameBuffer: Float32Array[] = [];
  private readonly BUFFER_SIZE = 5;
  private readonly MOTION_THRESHOLD = 5; // Minimum motion to register

  /**
   * Compute optical flow lite between consecutive frames
   * Returns delta (Δx, Δy) for each tracked object
   */
  computeMotion(
    currentFrame: ImageData,
    detectedObjects: DetectedObject[]
  ): MotionEvent[] {
    const motionEvents: MotionEvent[] = [];

    for (const obj of detectedObjects) {
      const currentPos: [number, number] = [obj.point[0], obj.point[1]];
      const prevPos = this.previousPoints.get(obj.label) || currentPos;
      
      const deltaX = currentPos[1] - prevPos[1]; // X is second element
      const deltaY = currentPos[0] - prevPos[0]; // Y is first element
      const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      // Gesture classification
      const gesture = this.classifyGesture(deltaX, deltaY, magnitude);

      if (magnitude > this.MOTION_THRESHOLD) {
        motionEvents.push({
          objectLabel: obj.label,
          affordance: obj.affordance,
          gesture,
          deltaX,
          deltaY,
          magnitude,
          timestamp: Date.now(),
        });
      }

      this.previousPoints.set(obj.label, currentPos);
    }

    // Update frame buffer for future analysis
    if (currentFrame) {
      const grayscale = this.toGrayscale(currentFrame);
      this.frameBuffer.push(grayscale);
      if (this.frameBuffer.length > this.BUFFER_SIZE) {
        this.frameBuffer.shift();
      }
    }

    return motionEvents;
  }

  /**
   * Classify gesture based on motion deltas and magnitude
   */
  private classifyGesture(dx: number, dy: number, mag: number): Gesture {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (mag < 10) return 'subtle';
    if (Math.abs(angle) < 45) return 'right';
    if (Math.abs(angle - 180) < 45 || Math.abs(angle + 180) < 45) return 'left';
    if (angle > 45 && angle < 135) return 'down';
    if (angle < -45 && angle > -135) return 'up';
    
    // Rotational detection based on magnitude
    if (mag > 30) {
      // Determine rotation direction based on angle
      return angle > 0 ? 'rotate_cw' : 'rotate_ccw';
    }
    
    return 'unknown';
  }

  /**
   * Convert ImageData to grayscale Float32Array for analysis
   */
  private toGrayscale(imageData: ImageData): Float32Array {
    const { data, width, height } = imageData;
    const gray = new Float32Array(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      // Standard grayscale conversion: 0.299R + 0.587G + 0.114B
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    return gray;
  }

  /**
   * Reset tracked points (useful when re-initializing detection)
   */
  reset(): void {
    this.previousPoints.clear();
    this.frameBuffer = [];
  }

  /**
   * Get the number of currently tracked objects
   */
  getTrackedCount(): number {
    return this.previousPoints.size;
  }
}
