import { NextResponse } from 'next/server';

// This route provides WebSocket connection info
// In production, you would use a separate WebSocket server or a service like Pusher/Ably
// For development, the socket.io server is set up in the custom server

export async function GET() {
  return NextResponse.json({
    message: 'WebSocket endpoint',
    info: 'Connect using socket.io-client to ws://localhost:3001',
    status: 'available',
  });
}
