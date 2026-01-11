# Setup Guide - Haptic Desktop Controller

This guide will help you set up and run the Haptic Desktop Controller.

## ✅ Prerequisites Check

Run the verification script to check your system:

```bash
./verify-setup.sh
```

## 📦 Installation Steps

### 1. Install Node.js Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 19
- Google Gemini AI SDK
- Socket.io and WebSocket libraries
- React Webcam
- Tailwind CSS

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Google Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Get your API key:** https://makersuite.google.com/app/apikey

### 3. Set Up Python Daemon

```bash
cd daemon
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## 🚀 Running the Application

### Option 1: Quick Start (Recommended)

Use the all-in-one start script:

```bash
./start-all.sh
```

This will start both the Next.js web app with WebSocket server and the Python daemon.

### Option 2: Manual Start

**Terminal 1 - Start Next.js with WebSocket:**
```bash
npm run dev:socket
```

**Terminal 2 - Start Python Daemon:**
```bash
cd daemon
source venv/bin/activate
python3 haptic_daemon.py
```

## 🌐 Accessing the Application

### On Desktop
Open your browser to: **http://localhost:3000**

### On Mobile (Same Network)
1. Find your computer's local IP address:
   - macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Linux: `ip addr show | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`

2. Open on mobile: **http://YOUR_IP:3000**

### Remote Access (Using ngrok)
```bash
npx ngrok http 3000
```

Use the provided ngrok URL on any device.

## 📱 Using the Application

1. **Allow Camera Access**
   - Browser will prompt for camera permissions
   - Grant access to use the gesture control

2. **Register Objects**
   - Click preset objects (hand, finger, pen) or add custom ones
   - Registered objects will be tracked in the video stream

3. **Start Using Gestures**
   - Position your hand in the camera view
   - Gestures are automatically detected and executed:
     - **Hand at top** → Scroll Up
     - **Hand at bottom** → Scroll Down  
     - **Hand on left** → Volume Down
     - **Hand on right** → Volume Up

4. **Watch Real-time Feedback**
   - Green circles show detected objects
   - Current gesture displays on the right panel
   - FPS and object count shown in the video panel

## 🔧 Configuration

### WebSocket Connection

The Python daemon connects to: `ws://localhost:3000/ws`

To change the connection, edit the daemon startup:

```bash
python3 haptic_daemon.py --uri ws://YOUR_HOST:PORT/ws
```

### Gesture Sensitivity

Edit `components/VideoStream.tsx` to adjust position thresholds:

```typescript
// Current thresholds
if (hand.y < 0.3) return "scroll_up";     // Top 30%
if (hand.y > 0.7) return "scroll_down";   // Bottom 30%
if (hand.x < 0.3) return "volume_down";   // Left 30%
if (hand.x > 0.7) return "volume_up";     // Right 30%
```

### Detection Frequency

Edit `components/VideoStream.tsx` interval:

```typescript
const interval = setInterval(captureAndDetect, 500); // Currently 500ms (2 FPS)
```

Decrease for faster detection (higher API usage) or increase for slower detection.

## 🐛 Troubleshooting

### Camera Not Working
- Ensure browser has camera permissions
- Try Chrome or Firefox (best compatibility)
- Check if another app is using the camera
- For HTTPS requirement in production, use Vercel or ngrok

### Python Daemon Not Connecting
- Verify Next.js app is running with WebSocket support (`npm run dev:socket`)
- Check that port 3000 is not blocked by firewall
- Look at daemon logs for connection errors

### Gestures Not Working
- Ensure Python daemon is connected (check terminal logs)
- Verify hand is detected (green circle should appear)
- Check gesture display panel updates
- Verify GEMINI_API_KEY is set correctly

### Volume Control Not Working

**macOS:**
- Volume control uses built-in `osascript` (should work out of the box)

**Linux:**
- Requires `amixer`:
  ```bash
  sudo apt-get install alsa-utils
  ```

**Windows:**
- Not currently supported in the Python daemon
- Would require Windows-specific audio libraries

### Build Errors
- ESLint circular dependency warning in Next.js 15 is a known issue and can be ignored
- Ensure all dependencies are installed: `npm install`
- Clear Next.js cache: `rm -rf .next`

## 📁 Project Structure

```
haptic-desktop-controller/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── detect-objects/      # Gemini AI object detection
│   │   └── send-gesture/        # WebSocket gesture broadcast
│   ├── page.tsx                 # Main UI
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── VideoStream.tsx          # Webcam & detection
│   ├── ObjectRegistration.tsx   # Object management
│   └── GestureDisplay.tsx       # Gesture visualization
├── daemon/                       # Python daemon
│   ├── haptic_daemon.py         # WebSocket client
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Virtual environment
├── server.js                     # Custom Next.js server with WebSocket
├── .env.local                    # Environment variables (create from example)
└── package.json                  # Node.js dependencies
```

## 🔐 Security Notes

- Desktop daemon only accepts localhost connections by default
- Camera access requires HTTPS in production (Vercel provides this)
- Images sent to Gemini API are not stored
- WebSocket uses ws:// protocol (upgrade to wss:// for production)

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for object detection |
| `NODE_ENV` | No | Set to `production` for production build |
| `PORT` | No | Server port (default: 3000) |

## 🚢 Deployment

### Development
```bash
npm run dev:socket
```

### Production Build
```bash
npm run build
npm run start:socket
```

### Vercel Deployment
```bash
vercel
```

Note: Custom server (server.js) is not supported on Vercel. For Vercel deployment, implement WebSocket via API routes or use a separate WebSocket service.

## 📚 API Documentation

### POST /api/detect-objects

Detects objects in an image using Gemini Vision.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "registeredObjects": ["hand", "finger"]
}
```

**Response:**
```json
{
  "objects": [
    {
      "label": "hand",
      "x": 0.5,
      "y": 0.3,
      "confidence": 0.95
    }
  ]
}
```

### POST /api/send-gesture

Broadcasts a gesture to connected Python daemons.

**Request:**
```json
{
  "gesture": "scroll_up"
}
```

**Response:**
```json
{
  "success": true,
  "gesture": "scroll_up"
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC License

---

**Need Help?** Open an issue on GitHub or check the troubleshooting section above.
