# Haptic Desktop Controller

Transform everyday objects on your desk into intuitive controls for your computer. Point your phone camera at objects like coffee mugs, notebooks, or pens, and use their physical movements to control volume, scroll, switch tabs, and more.

## 🎯 Overview

Haptic Desktop Controller uses computer vision (powered by Google Gemini) to detect objects in your workspace and track their movements in real-time. Physical gestures with these objects are translated into desktop commands via a WebSocket connection to a Python daemon running on your computer.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE (Web App)                            │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Camera Stream   │────────▶│ Real-time Feed   │             │
│  └──────────────────┘         └──────────────────┘             │
│           ▼                                                     │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ Object Detection │────────▶│ Motion Tracking  │             │
│  │  (Gemini AI)     │         │  (Frame-to-Frame)│             │
│  └──────────────────┘         └──────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                 ▼
            ┌────────────────────────────────────┐
            │         WebSocket Server          │
            │      (Real-time Commands)         │
            └────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DESKTOP (Python Daemon)                       │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  WebSocket Client│◀────────│   pynput         │             │
│  └──────────────────┘         └──────────────────┘             │
│           ▼                                                     │
│  ┌──────────────────────────────────────────────┐              │
│  │   System Commands (Volume/Scroll/Tabs/etc)   │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for web app)
- Python 3.9+ (for desktop daemon)
- A smartphone or tablet with a camera
- Google Gemini API key (optional, demo mode available)

### 1. Install Web App

```bash
cd web-app
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### 3. Start the Web Server

```bash
# Standard Next.js development server
npm run dev

# OR with WebSocket support
npm run dev:socket
```

### 4. Install Desktop Daemon

```bash
cd desktop-daemon
pip install -r requirements.txt
```

### 5. Run Desktop Daemon

```bash
python desktop_daemon.py --host localhost --port 3000
```

### 6. Open the Web App

Open http://localhost:3000 on your mobile device (must be on same network) or use ngrok for remote access.

## 📱 Usage

1. **Setup Tab**: Point your phone camera at your desk and tap "Detect Objects"
2. **Configure Mappings**: Assign actions to each detected object
   - Coffee mug rotation → Volume control
   - Notebook slide → Scroll
   - Pen rotation → Brightness
3. **Control Tab**: Start tracking and interact with your objects
4. The desktop daemon will execute the corresponding commands

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
- **State Management**: Zustand
- **Real-time**: Socket.io
- **AI**: Google Gemini API

### Desktop Daemon (Python)
- **OS Control**: pynput
- **Communication**: websockets
- **Platforms**: Windows, macOS, Linux

## 📁 Project Structure

```
├── web-app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── detect-objects/   # Gemini object detection
│   │   │   │   └── interpret-gesture/ # Gesture interpretation
│   │   │   ├── page.tsx              # Main controller UI
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ObjectRegistration.tsx
│   │   │   └── MappingConfigurator.tsx
│   │   ├── lib/
│   │   │   ├── motionTracker.ts      # Motion detection
│   │   │   └── store.ts              # Zustand store
│   │   └── types/
│   │       └── index.ts
│   ├── server.js                      # Custom server with Socket.io
│   └── vercel.json
├── desktop-daemon/
│   ├── desktop_daemon.py             # Python daemon
│   └── requirements.txt
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