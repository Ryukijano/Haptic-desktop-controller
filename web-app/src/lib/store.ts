import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DetectedObject, UserMappings } from '@/types';

interface AppState {
  // Object Detection
  objects: DetectedObject[];
  setObjects: (objects: DetectedObject[]) => void;
  
  // Tracking State
  isTracking: boolean;
  setTracking: (tracking: boolean) => void;
  
  // User Mappings
  mappings: UserMappings;
  setMapping: (objectLabel: string, gesture: string, command: string) => void;
  removeMapping: (key: string) => void;
  clearMappings: () => void;
  
  // Connection State
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  
  // Desktop Daemon Connection
  desktopConnected: boolean;
  setDesktopConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Object Detection
      objects: [],
      setObjects: (objects) => set({ objects }),
      
      // Tracking State
      isTracking: false,
      setTracking: (isTracking) => set({ isTracking }),
      
      // User Mappings
      mappings: {},
      setMapping: (objectLabel, gesture, command) =>
        set((state) => ({
          mappings: {
            ...state.mappings,
            [`${objectLabel}:${gesture}`]: command,
          },
        })),
      removeMapping: (key) =>
        set((state) => {
          const newMappings = { ...state.mappings };
          delete newMappings[key];
          return { mappings: newMappings };
        }),
      clearMappings: () => set({ mappings: {} }),
      
      // Connection State
      isConnected: false,
      setConnected: (isConnected) => set({ isConnected }),
      
      // Desktop Daemon Connection
      desktopConnected: false,
      setDesktopConnected: (desktopConnected) => set({ desktopConnected }),
    }),
    {
      name: 'haptic-desktop-storage',
      partialize: (state) => ({
        mappings: state.mappings,
      }),
    }
  )
);
