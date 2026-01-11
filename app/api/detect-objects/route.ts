import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { image, registeredObjects } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract base64 data from data URL
    const base64Data = image.split(",")[1] || image;

    // Create robotics-focused prompt
    const objectList = registeredObjects && registeredObjects.length > 0
      ? registeredObjects.join(", ")
      : "hands, fingers, common objects";

    const prompt = `You are a robotics vision system analyzing this image for gesture control.
    
Task: Detect and locate the following objects in the image: ${objectList}

For each detected object, provide:
1. The object label
2. Normalized 2D coordinates (x, y) where 0,0 is top-left and 1,1 is bottom-right
3. Confidence score (0-1)

Return ONLY a JSON array with this exact structure:
[
  {
    "label": "object_name",
    "x": 0.5,
    "y": 0.5,
    "confidence": 0.95
  }
]

If no objects are detected, return an empty array: []

Focus on hands and gestures for desktop control. Be precise with coordinates.`;

    // Call Gemini API with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let objects = [];
    try {
      // Extract JSON from response (remove markdown code blocks if present)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        objects = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      // Return empty array if parsing fails
      objects = [];
    }

    // Validate and normalize the response
    const validObjects = objects
      .filter((obj: any) => 
        obj.label && 
        typeof obj.x === 'number' && 
        typeof obj.y === 'number' &&
        obj.x >= 0 && obj.x <= 1 &&
        obj.y >= 0 && obj.y <= 1
      )
      .map((obj: any) => ({
        label: obj.label,
        x: obj.x,
        y: obj.y,
        confidence: obj.confidence || 0.5,
      }));

    return NextResponse.json({ objects: validObjects });
  } catch (error) {
    console.error("Detection error:", error);
    return NextResponse.json(
      { error: "Failed to process image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
