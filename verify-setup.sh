#!/bin/bash
# Test script to verify the setup

echo "🔍 Haptic Desktop Controller - Setup Verification"
echo "=================================================="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found."
    exit 1
fi

# Check Python 3
echo "Checking Python 3..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python 3 installed: $PYTHON_VERSION"
else
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check if dependencies are installed
echo ""
echo "Checking Node.js dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Node modules found"
else
    echo "⚠️  Node modules not found. Run: npm install"
fi

# Check environment file
echo ""
echo "Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    if grep -q "GEMINI_API_KEY=your_gemini_api_key_here" .env.local; then
        echo "⚠️  WARNING: Please update GEMINI_API_KEY in .env.local"
    else
        echo "✅ GEMINI_API_KEY appears to be configured"
    fi
else
    echo "⚠️  .env.local not found. Copy .env.local.example and configure it."
fi

# Check Python virtual environment
echo ""
echo "Checking Python daemon setup..."
if [ -d "daemon/venv" ]; then
    echo "✅ Python virtual environment found"
else
    echo "⚠️  Python virtual environment not found. Run: cd daemon && python3 -m venv venv"
fi

echo ""
echo "=================================================="
echo "Setup verification complete!"
echo ""
echo "To start the application:"
echo "  1. npm run dev           (Start Next.js app)"
echo "  2. cd daemon && ./start.sh  (Start Python daemon)"
