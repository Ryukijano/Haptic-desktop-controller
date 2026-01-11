#!/bin/bash
# Quick start script for Haptic Desktop Controller

echo "🚀 Starting Haptic Desktop Controller"
echo "======================================"
echo ""

# Check if setup is complete
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Run: npm install"
    exit 1
fi

if [ ! -f ".env.local" ]; then
    echo "❌ Environment file not found. Run: cp .env.local.example .env.local"
    exit 1
fi

if [ ! -d "daemon/venv" ]; then
    echo "❌ Python virtual environment not found."
    echo "   Run: cd daemon && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

echo "✅ All dependencies installed"
echo ""
echo "Starting services..."
echo ""

# Start Next.js server with WebSocket support in background
echo "📱 Starting Next.js app with WebSocket server on port 3000..."
npm run dev:socket &
WEB_PID=$!

# Wait for web server to be ready
sleep 5

# Start Python daemon
echo "🖥️  Starting Python daemon..."
cd daemon
source venv/bin/activate
python3 haptic_daemon.py &
DAEMON_PID=$!
cd ..

echo ""
echo "======================================"
echo "✅ All services started!"
echo ""
echo "📱 Web App: http://localhost:3000"
echo "🔌 WebSocket: ws://localhost:3000/ws"
echo ""
echo "To stop all services, press Ctrl+C or run:"
echo "  kill $WEB_PID $DAEMON_PID"
echo ""
echo "Logs:"
echo "======================================"

# Wait for processes
wait
