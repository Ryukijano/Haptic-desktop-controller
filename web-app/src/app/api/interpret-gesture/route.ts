import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MotionEvent, GestureInterpretation } from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface InterpretGestureRequest {
  motionEvent: MotionEvent;
  userMapping: string;
}

// Map user commands to action parameters
const COMMAND_MAPPINGS: Record<string, { action: string; baseValue: number }> = {
  volume_up: { action: 'adjust_volume', baseValue: 1 },
  volume_down: { action: 'adjust_volume', baseValue: -1 },
  brightness_up: { action: 'adjust_brightness', baseValue: 1 },
  brightness_down: { action: 'adjust_brightness', baseValue: -1 },
  scroll_up: { action: 'scroll', baseValue: 1 },
  scroll_down: { action: 'scroll', baseValue: -1 },
  pan_left: { action: 'pan', baseValue: -1 },
  pan_right: { action: 'pan', baseValue: 1 },
  previous_tab: { action: 'tab_switch', baseValue: -1 },
  next_tab: { action: 'tab_switch', baseValue: 1 },
  click: { action: 'click', baseValue: 1 },
  enter: { action: 'keypress', baseValue: 1 },
  space: { action: 'keypress', baseValue: 2 },
  play_pause: { action: 'media', baseValue: 1 },
  mute: { action: 'media', baseValue: 2 },
};

export async function POST(request: NextRequest) {
  try {
    const body: InterpretGestureRequest = await request.json();
    const { motionEvent, userMapping } = body;

    if (!motionEvent || !userMapping) {
      return NextResponse.json(
        { error: 'Missing required fields: motionEvent and userMapping' },
        { status: 400 }
      );
    }

    // Calculate intensity based on motion magnitude
    const intensity = Math.min(1, motionEvent.magnitude / 100);
    
    // Get command mapping
    const mapping = COMMAND_MAPPINGS[userMapping];
    if (!mapping) {
      return NextResponse.json(
        { error: `Unknown command mapping: ${userMapping}` },
        { status: 400 }
      );
    }

    // If API key is available, use Gemini for more sophisticated interpretation
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
          Interpret this physical gesture for desktop control and return ONLY valid JSON:
          
          Input:
          - Object: ${motionEvent.objectLabel}
          - Gesture: ${motionEvent.gesture}
          - Delta: (${motionEvent.deltaX}, ${motionEvent.deltaY})
          - Magnitude: ${motionEvent.magnitude}
          - Affordance: ${motionEvent.affordance}
          - Mapped Command: ${userMapping}
          
          Based on the gesture and magnitude, determine the appropriate intensity (0-1) and value multiplier.
          
          Return JSON only:
          {
            "gesture_type": "continuous|discrete",
            "intensity": 0.0-1.0,
            "value_multiplier": 1-5,
            "confidence": 0.0-1.0
          }
        `;

        const response = await model.generateContent(prompt);
        const responseText = response.response.text()
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const geminiInterpretation = JSON.parse(responseText);
        
        // Build final interpretation with Gemini enhancement
        const interpretation: GestureInterpretation = {
          gesture_type: geminiInterpretation.gesture_type || 'continuous',
          intensity: geminiInterpretation.intensity || intensity,
          command: {
            action: mapping.action,
            value: Math.round(mapping.baseValue * (geminiInterpretation.value_multiplier || 1)),
            direction: mapping.baseValue > 0 ? 'up' : 'down',
          },
        };

        return NextResponse.json(interpretation);
      } catch (geminiError) {
        // Fall back to basic interpretation if Gemini fails
        console.log('Gemini interpretation failed, using basic logic:', geminiError);
      }
    }

    // Basic interpretation without Gemini
    const valueMultiplier = Math.ceil(intensity * 3) || 1;
    
    const interpretation: GestureInterpretation = {
      gesture_type: motionEvent.affordance === 'press' ? 'discrete' : 'continuous',
      intensity,
      command: {
        action: mapping.action,
        value: mapping.baseValue * valueMultiplier,
        direction: mapping.baseValue > 0 ? 'up' : 'down',
      },
    };

    return NextResponse.json(interpretation);
  } catch (error) {
    console.error('Gesture interpretation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Gesture interpretation failed: ${message}` },
      { status: 500 }
    );
  }
}
