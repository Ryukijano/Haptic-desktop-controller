const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket server for Python daemon
  const wss = new WebSocket.Server({ 
    server: httpServer,
    path: '/ws'
  });

  const clients = new Set();

  wss.on('connection', (ws) => {
    console.log('Python daemon connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('Python daemon disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Socket.io for web app (optional future use)
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Web client connected');
    
    socket.on('disconnect', () => {
      console.log('Web client disconnected');
    });
  });

  // Function to broadcast gesture to Python daemon
  global.broadcastGesture = (gesture) => {
    const message = JSON.stringify({ type: 'gesture', gesture });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
    });
});
