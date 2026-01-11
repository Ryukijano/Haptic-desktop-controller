import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI (will use GEMINI_API_KEY from environment)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const REGISTRATION_PROMPT = `
You are analyzing a desk scene for object tracking. Identify all prominent objects that could be used as physical controls.

Return ONLY valid JSON (no markdown, no code fences, no explanation):
[
  {"point": [y, x], "label": "object name", "affordance": "rotation|translation|press"},
  ...
]

Guidelines:
- Points are normalized 0-1000 (y is vertical, x is horizontal from top-left)
- "rotation" for round objects that can spin (mugs, bottles, wheels)
- "translation" for flat objects that can slide (books, phones, papers)
- "press" for objects that can be pressed (buttons, keys, small items)
- Max 10 objects
- Use simple, lowercase labels

Example output:
[
  {"point": [250, 350], "label": "coffee mug", "affordance": "rotation"},
  {"point": [500, 200], "label": "notebook", "affordance": "translation"},
  {"point": [750, 750], "label": "pen", "affordance": "rotation"}
]
`;

export async function POST(request: NextRequest) {
  try {
    // Get raw image bytes from request
    const buffer = await request.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      // Return mock data for development/demo purposes
      console.log('GEMINI_API_KEY not configured, returning mock data');
      return NextResponse.json({
        objects: [
          { point: [300, 400], label: 'coffee mug', affordance: 'rotation' },
          { point: [500, 300], label: 'notebook', affordance: 'translation' },
          { point: [200, 600], label: 'pen holder', affordance: 'rotation' },
          { point: [700, 500], label: 'keyboard', affordance: 'translation' },
        ],
        mock: true,
      });
    }

    // Use Gemini model for object detection
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash' // Using available model
    });

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
      { text: REGISTRATION_PROMPT },
    ]);

    const responseText = response.response.text();
    
    // Clean up response - remove markdown code fences if present
    const cleanedJSON = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const objects = JSON.parse(cleanedJSON);
      
      // Validate the response structure
      if (!Array.isArray(objects)) {
        throw new Error('Response is not an array');
      }

      // Validate and sanitize each object
      const validatedObjects = objects
        .filter((obj: { point?: unknown; label?: string; affordance?: string }) => 
          obj && 
          Array.isArray(obj.point) && 
          obj.point.length === 2 &&
          typeof obj.label === 'string' &&
          typeof obj.affordance === 'string'
        )
        .slice(0, 10) // Max 10 objects
        .map((obj: { point: number[]; label: string; affordance: string }) => ({
          point: [Math.round(obj.point[0]), Math.round(obj.point[1])],
          label: obj.label.toLowerCase().trim(),
          affordance: ['rotation', 'translation', 'press'].includes(obj.affordance) 
            ? obj.affordance 
            : 'translation',
        }));

      return NextResponse.json({ objects: validatedObjects });
    } catch {
      console.error('Failed to parse Gemini response:', cleanedJSON);
      return NextResponse.json(
        { error: 'Failed to parse object detection response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Object detection error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Object detection failed: ${message}` },
      { status: 500 }
    );
  }
}
