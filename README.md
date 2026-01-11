# Haptic Desktop Controller

A gesture-based desktop control system using **Google Gemini AI** for real-time object detection and motion tracking. Control your macOS/Linux desktop through hand gestures captured via webcam.

> **Note**: This repository contains two implementations:
> - **Root directory** (recommended): Simple webcam-based gesture control with Socket.io
> - **web-app directory**: Advanced mobile-first implementation with more features
> 
> This guide focuses on the root directory implementation for quick setup and testing.

## 🎯 Overview

Haptic Desktop Controller uses computer vision (powered by Google Gemini) to detect objects in your workspace and track their movements in real-time. Physical gestures with these objects are translated into desktop commands via a Socket.io connection to a Python daemon running on your computer.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEB APP (Next.js)                            │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Webcam Stream   │────────▶│ Real-time Feed   │             │
│  └──────────────────┘         └──────────────────┘             │
│           ▼                                                     │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ Object Detection │────────▶│ Gesture Tracking │             │
│  │  (Gemini API)    │         │  (Client-side)   │             │
│  └──────────────────┘         └──────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                 ▼
            ┌────────────────────────────────────┐
            │     Socket.io Server (Node.js)    │
            │      (Real-time Events)           │
            └────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DESKTOP (Python Daemon)                        │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ Socket.io Client │◀────────│   pynput         │             │
│  └──────────────────┘         └──────────────────┘             │
│           ▼                                                     │
│  ┌──────────────────────────────────────────────┐              │
│  │   System Commands (Volume/Scroll/etc)        │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for web app)
- Python 3.8+ (for desktop daemon)
- A device with a webcam (laptop or USB webcam)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and add your GEMINI_API_KEY
# GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start the Web Server with Socket.io

```bash
# Development mode with WebSocket support
npm run dev:socket
```

The app will be available at `http://localhost:3000`

### 4. Install Desktop Daemon (in a new terminal)

```bash
cd daemon

# The start script will create a virtual environment and install dependencies
./start.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 haptic_daemon.py
```

### 5. Use the Application

1. Open `http://localhost:3000` in your browser
2. Allow webcam access when prompted
3. Register objects to track (e.g., "hand", "finger", "pen")
4. Perform gestures in front of the camera:
   - **Hand at top** → Scroll Up
   - **Hand at bottom** → Scroll Down
   - **Hand on left** → Volume Down
   - **Hand on right** → Volume Up
5. The desktop daemon will execute the corresponding commands

## 🎮 Available Commands

| Action | Description | Object Type |
|--------|-------------|-------------|
| Volume Up/Down | Adjust system volume | Rotation objects (mugs, wheels) |
| Scroll Up/Down | Scroll in focused window | Translation objects (books, phones) |
| Brightness Up/Down | Adjust screen brightness | Rotation objects |
| Pan Left/Right | Navigate horizontally | Translation objects |
| Tab Switch | Next/Previous tab | Translation objects |
| Play/Pause | Media playback control | Press objects |
| Mute | Toggle audio mute | Press objects |

## 🛠 Tech Stack

### Web App (Next.js)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Webcam**: react-webcam
- **Real-time**: Socket.io
- **AI**: Google Gemini API (Gemini 1.5 Flash)

### Desktop Daemon (Python)
- **OS Control**: pynput
- **Communication**: python-socketio[client]
- **Platforms**: macOS, Linux

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   └── detect-objects/
│   │       └── route.ts           # Gemini object detection API
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main controller UI
├── components/
│   ├── VideoStream.tsx            # Webcam streaming & gesture detection
│   ├── ObjectRegistration.tsx     # Object registration UI
│   └── GestureDisplay.tsx         # Real-time gesture display
├── daemon/
│   ├── haptic_daemon.py           # Python Socket.io daemon
│   ├── requirements.txt           # Python dependencies
│   └── start.sh                   # Daemon startup script
├── lib/
│   └── useWebSocket.ts            # WebSocket hook (legacy)
├── server.js                      # Custom Next.js server with Socket.io
├── package.json                   # Node.js dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | No (demo mode available) |

### Customizing Mappings

Mappings are stored in the browser's localStorage. You can modify `src/components/MappingConfigurator.tsx` to add new command types.

## 🚢 Deployment

### Vercel (Recommended)

```bash
cd web-app
vercel
```

Add `GEMINI_API_KEY` to your Vercel environment variables.

### Self-hosted

Build and run with:

```bash
npm run build
npm run start:socket
```

## 🔒 Security Notes

- The desktop daemon only accepts connections from localhost by default
- Camera access requires HTTPS in production (Vercel provides this automatically)
- Object detection happens server-side; images are not stored

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Tips

- For better gesture detection, ensure good lighting in your environment
- Position your hand clearly in view of the webcam
- The Gemini API may take a moment to process images, so gestures are detected every 500ms
- Check the connection status indicator (green dot) to ensure Socket.io is connected
- The daemon must be running for gestures to control your system

## 🔍 Troubleshooting

### Webcam not working
- Ensure browser has webcam permissions
- Try a different browser (Chrome/Firefox recommended)
- Check if another application is using the webcam

### Socket.io connection issues
- Verify the server is running with `npm run dev:socket`
- Check that port 3000 is not blocked by firewall
- Look for the green connection indicator in the UI

### Python daemon connection issues
- Ensure the daemon is running in a separate terminal
- Check that it's connecting to the correct URL (http://localhost:3000)
- Look for "Connected to Socket.io server" message in daemon logs

### Volume control not working
- **macOS**: Uses `osascript` (built-in)
- **Linux**: Requires `amixer` (usually pre-installed)
  ```bash
  sudo apt-get install alsa-utils  # If missing on Linux
  ```

### Gemini API errors
- Verify your API key is correct in `.env.local`
- Check API quota limits at [Google AI Studio](https://makersuite.google.com/)
- Ensure you have billing enabled if required

## 🚀 Future Enhancements

- [ ] More gesture types (swipe, pinch, rotation)
- [ ] Custom gesture training
- [ ] Multi-object tracking
- [ ] Gesture macros and shortcuts
- [ ] Windows support for daemon
- [ ] Mobile app version
- [ ] Configuration UI for gesture mappings

---

Built with ❤️ using Next.js, Socket.io, and Google Gemini AI
