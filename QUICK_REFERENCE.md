# Quick Reference Guide

## 🚀 Start Commands

```bash
# Quick start (all services)
./start-all.sh

# Manual start - Terminal 1
npm run dev:socket

# Manual start - Terminal 2
cd daemon && source venv/bin/activate && python3 haptic_daemon.py
```

## 📍 URLs

- **Web App**: http://localhost:3000
- **WebSocket**: ws://localhost:3000/ws
- **Mobile**: http://YOUR_LOCAL_IP:3000

## 🎮 Gestures

| Hand Position | Action |
|--------------|--------|
| Top (y < 0.3) | Scroll Up ↑ |
| Bottom (y > 0.7) | Scroll Down ↓ |
| Left (x < 0.3) | Volume Down 🔉 |
| Right (x > 0.7) | Volume Up 🔊 |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server.js` | WebSocket server |
| `app/page.tsx` | Main UI |
| `components/VideoStream.tsx` | Camera & detection |
| `app/api/detect-objects/route.ts` | Gemini AI integration |
| `daemon/haptic_daemon.py` | Desktop control |
| `.env.local` | API key (create from .env.local.example) |

## 🔧 Configuration

### Adjust Detection Speed
`components/VideoStream.tsx` line 90:
```typescript
const interval = setInterval(captureAndDetect, 500); // milliseconds
```

### Adjust Gesture Thresholds
`components/VideoStream.tsx` lines 81-84:
```typescript
if (hand.y < 0.3) return "scroll_up";     // 0.0-1.0
if (hand.y > 0.7) return "scroll_down";
if (hand.x < 0.3) return "volume_down";
if (hand.x > 0.7) return "volume_up";
```

## 🐛 Quick Fixes

### Camera not working?
```bash
# Use Chrome or Firefox
# Check browser permissions
# Ensure HTTPS (use ngrok in production)
```

### Daemon not connecting?
```bash
# Check Next.js is running with WebSocket
npm run dev:socket

# Verify port 3000 is open
lsof -i :3000
```

### Gestures not executing?
```bash
# Check daemon logs
cd daemon && source venv/bin/activate && python3 haptic_daemon.py --debug

# Verify API key is set
grep GEMINI_API_KEY .env.local
```

## 📦 Dependencies

### Install Node modules
```bash
npm install
```

### Install Python packages
```bash
cd daemon
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 🔍 Verify Setup

```bash
./verify-setup.sh
```

## 🛠 Development

### Build
```bash
npm run build
```

### Production
```bash
npm run start:socket
```

### Lint (ignore circular warning)
```bash
npm run lint
```

## 📝 Environment Variables

Create `.env.local`:
```env
GEMINI_API_KEY=your_key_here
```

Get key: https://makersuite.google.com/app/apikey

## 🌐 Remote Access

```bash
npx ngrok http 3000
# Use the ngrok URL on any device
```

## 📚 Documentation

- Full setup: `SETUP.md`
- Implementation details: `IMPLEMENTATION.md`
- Project overview: `README.md`

---

**Need help?** Check SETUP.md for troubleshooting or open an issue on GitHub.
