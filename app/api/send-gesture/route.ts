import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { gesture } = await request.json();

    if (!gesture) {
      return NextResponse.json(
        { error: "No gesture provided" },
        { status: 400 }
      );
    }

    // Broadcast gesture to WebSocket clients (Python daemon)
    if (global.broadcastGesture) {
      global.broadcastGesture(gesture);
    }

    return NextResponse.json({ success: true, gesture });
  } catch (error) {
    console.error("Send gesture error:", error);
    return NextResponse.json(
      { error: "Failed to send gesture" },
      { status: 500 }
    );
  }
}
