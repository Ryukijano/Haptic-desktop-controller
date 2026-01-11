// Custom server with Socket.io support
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
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track connected clients
  const clients = {
    mobile: new Set(),
    desktop: new Set(),
  };

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Client registration
    socket.on('register', (clientType) => {
      if (clientType === 'desktop') {
        clients.desktop.add(socket.id);
        // Notify mobile clients that desktop is connected
        io.emit('desktop_connected');
        console.log(`[Socket.io] Desktop daemon registered: ${socket.id}`);
      } else {
        clients.mobile.add(socket.id);
        console.log(`[Socket.io] Mobile client registered: ${socket.id}`);
      }
    });

    // Handle gesture interpretation from mobile
    socket.on('gesture_interpreted', (interpretation) => {
      console.log('[Socket.io] Gesture interpreted:', interpretation);
      // Broadcast to desktop clients
      io.emit('motion_command', interpretation.command || interpretation);
    });

    // Handle direct commands (for testing)
    socket.on('send_command', (command) => {
      console.log('[Socket.io] Direct command:', command);
      io.emit('motion_command', command);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      
      if (clients.desktop.has(socket.id)) {
        clients.desktop.delete(socket.id);
        io.emit('desktop_disconnected');
      }
      clients.mobile.delete(socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
