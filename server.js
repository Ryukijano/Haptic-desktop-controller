// Custom server with Socket.io support for Haptic Desktop Controller
// Run with: node server.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  console.log('[Server] Socket.io initialized');

  // Handle WebSocket connections
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Handle gesture events from frontend
    socket.on('gesture', (data) => {
      console.log('[Socket.io] Gesture received:', data);
      // Broadcast to all connected clients (including daemon)
      io.emit('gesture', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
