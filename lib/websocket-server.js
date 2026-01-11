/**
 * WebSocket Server Example for Haptic Desktop Controller
 * 
 * Note: Next.js API routes don't natively support WebSocket connections.
 * For WebSocket support, you have two options:
 * 
 * 1. Use a custom Next.js server (server.js)
 * 2. Use a separate WebSocket server
 * 
 * This file provides an example of a standalone WebSocket server
 * that can be run alongside the Next.js app.
 */

// To use this, install ws: npm install ws
// Then run: node lib/websocket-server.js

const WebSocket = require('ws');

const PORT = 3001; // Use different port from Next.js (3000)

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on ws://localhost:${PORT}`);

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      // Broadcast to all connected clients
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Haptic Controller WebSocket server'
  }));
});

// Broadcast gesture updates
function broadcastGesture(gesture) {
  const message = JSON.stringify({
    type: 'gesture',
    gesture: gesture,
    timestamp: Date.now()
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Example: Broadcast a gesture every 5 seconds (for testing)
setInterval(() => {
  const gestures = ['scroll_up', 'scroll_down', 'volume_up', 'volume_down', 'idle'];
  const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
  broadcastGesture(randomGesture);
}, 5000);

module.exports = { broadcastGesture };
