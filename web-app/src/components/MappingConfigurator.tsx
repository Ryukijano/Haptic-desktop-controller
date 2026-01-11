'use client';

import { useAppStore } from '@/lib/store';
import { DetectedObject } from '@/types';

const AVAILABLE_COMMANDS = {
  rotation: [
    { value: 'volume_up', label: 'Volume Up' },
    { value: 'volume_down', label: 'Volume Down' },
    { value: 'brightness_up', label: 'Brightness Up' },
    { value: 'brightness_down', label: 'Brightness Down' },
    { value: 'scroll_up', label: 'Scroll Up' },
    { value: 'scroll_down', label: 'Scroll Down' },
  ],
  translation: [
    { value: 'pan_left', label: 'Pan Left' },
    { value: 'pan_right', label: 'Pan Right' },
    { value: 'previous_tab', label: 'Previous Tab' },
    { value: 'next_tab', label: 'Next Tab' },
    { value: 'scroll_up', label: 'Scroll Up' },
    { value: 'scroll_down', label: 'Scroll Down' },
  ],
  press: [
    { value: 'click', label: 'Mouse Click' },
    { value: 'enter', label: 'Enter Key' },
    { value: 'space', label: 'Space Key' },
    { value: 'play_pause', label: 'Play/Pause Media' },
    { value: 'mute', label: 'Mute/Unmute' },
  ],
};

interface MappingConfiguratorProps {
  objects?: DetectedObject[];
}

export default function MappingConfigurator({ objects }: MappingConfiguratorProps) {
  const { objects: storeObjects, mappings, setMapping, removeMapping } = useAppStore();
  
  // Use provided objects or fall back to store
  const displayObjects = objects || storeObjects;

  const handleMappingChange = (objectLabel: string, gesture: string, command: string) => {
    if (command) {
      setMapping(objectLabel, gesture, command);
    } else {
      removeMapping(`${objectLabel}:${gesture}`);
    }
  };

  const getCommandOptions = (affordance: string) => {
    return AVAILABLE_COMMANDS[affordance as keyof typeof AVAILABLE_COMMANDS] || AVAILABLE_COMMANDS.translation;
  };

  const getGesturesForAffordance = (affordance: string) => {
    switch (affordance) {
      case 'rotation':
        return ['rotate_cw', 'rotate_ccw'];
      case 'press':
        return ['press'];
      default:
        return ['left', 'right', 'up', 'down'];
    }
  };

  if (displayObjects.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
        <p className="text-gray-400">No objects detected yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Use the camera to detect objects on your desk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Configure Mappings</h3>
      
      <div className="grid gap-4">
        {displayObjects.map((obj, index) => (
          <div 
            key={`${obj.label}-${index}`}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-white capitalize">{obj.label}</h4>
                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                  {obj.affordance}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Point: [{obj.point[0]}, {obj.point[1]}]
              </span>
            </div>
            
            <div className="space-y-2">
              {getGesturesForAffordance(obj.affordance).map((gesture) => (
                <div key={gesture} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-24 capitalize">
                    {gesture.replace('_', ' ')}:
                  </span>
                  <select
                    value={mappings[`${obj.label}:${gesture}`] || ''}
                    onChange={(e) => handleMappingChange(obj.label, gesture, e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select action...</option>
                    {getCommandOptions(obj.affordance).map((cmd) => (
                      <option key={cmd.value} value={cmd.value}>
                        {cmd.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Current Mappings Summary */}
      {Object.keys(mappings).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Active Mappings</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(mappings).map(([key, command]) => (
              <div 
                key={key}
                className="bg-green-500/10 border border-green-500/20 rounded px-2 py-1 text-xs text-green-400"
              >
                {key} → {command}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
