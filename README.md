# Haptic Desktop Controller

A gesture-based desktop control system using **Gemini Robotics-ER 1.5** for real-time object detection and motion tracking. Control your macOS/Linux desktop through hand gestures captured via webcam.

## Features

### 🎥 Next.js 15 Mobile-Optimized App
- **Video Streaming**: Real-time webcam feed with motion tracking overlay
- **Object Registration UI**: Register custom objects for tracking (hand, finger, pen, etc.)
- **Real-time Gesture Interpretation**: Visual feedback of detected gestures
- **Responsive Design**: Works on desktop and mobile devices

### 🤖 Gemini Robotics Integration
- **AI-Powered Detection**: Uses Google's Gemini 1.5 Flash model
- **Robotics Prompt Engineering**: Specialized prompts for gesture recognition
- **Normalized 2D Coordinates**: Precise object location tracking
- **Base64 Image Processing**: Efficient image encoding for API calls

### 🖥️ Python Daemon (macOS/Linux)
- **WebSocket Client**: Real-time communication with the web app
- **pynput Integration**: Native OS control for volume and scrolling
- **Cross-Platform**: Supports both macOS and Linux
- **System Commands**: Execute OS-specific commands for volume control

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js App   │─────▶│  Gemini API      │      │  Python Daemon  │
│   (Frontend)    │      │  /api/detect-    │      │  (OS Control)   │
│                 │      │   objects        │      │                 │
│ - Video Stream  │      │                  │      │ - WebSocket     │
│ - UI Controls   │      │ - Image Analysis │      │ - pynput        │
│ - Gesture View  │      │ - JSON Response  │      │ - Volume/Scroll │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                                                  ▲
         │                    WebSocket                     │
         └──────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 18+ (for Next.js app)
- **Python 3.8+** (for daemon)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Webcam** (for gesture capture)
- **macOS or Linux** (for daemon OS controls)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ryukijano/Haptic-desktop-controller.git
cd Haptic-desktop-controller
```

### 2. Set Up Next.js App

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Set Up Python Daemon

```bash
cd daemon

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Running the Next.js App

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The app will be available at `http://localhost:3000`

### Running the Python Daemon

```bash
cd daemon
./start.sh

# Or manually:
source venv/bin/activate
python3 haptic_daemon.py
```

**Note**: The daemon will attempt to connect to `ws://localhost:3000/ws` by default.

### Using the Application

1. **Open the web app** in your browser
2. **Allow webcam access** when prompted
3. **Register objects** you want to track (e.g., "hand", "finger")
4. **Perform gestures** in front of the camera:
   - **Hand at top** → Scroll Up
   - **Hand at bottom** → Scroll Down
   - **Hand on left** → Volume Down
   - **Hand on right** → Volume Up
5. The **real-time gesture display** shows the current detected gesture

## API Endpoints

### POST `/api/detect-objects`

Detects objects in an image using Gemini Vision API.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
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

## Gesture Mapping

| Hand Position | Gesture | OS Action |
|--------------|---------|-----------|
| Top (y < 0.3) | `scroll_up` | Scroll page up |
| Bottom (y > 0.7) | `scroll_down` | Scroll page down |
| Left (x < 0.3) | `volume_down` | Decrease volume 5% |
| Right (x > 0.7) | `volume_up` | Increase volume 5% |

## Project Structure

```
haptic-desktop-controller/
├── app/
│   ├── api/
│   │   └── detect-objects/
│   │       └── route.ts          # Gemini API integration
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/
│   ├── VideoStream.tsx            # Video streaming component
│   ├── ObjectRegistration.tsx     # Object registration UI
│   └── GestureDisplay.tsx         # Gesture visualization
├── daemon/
│   ├── haptic_daemon.py           # Python WebSocket client
│   ├── requirements.txt           # Python dependencies
│   └── start.sh                   # Daemon startup script
├── lib/                           # Utility functions (future)
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Node.js dependencies
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Troubleshooting

### Webcam not working
- Ensure browser has webcam permissions
- Try a different browser (Chrome/Firefox recommended)
- Check if another application is using the webcam

### Python daemon connection issues
- Verify the WebSocket server is running (Next.js app must be running)
- Check firewall settings
- Ensure port 3000 is not blocked

### Volume control not working
- **macOS**: Uses `osascript` (built-in)
- **Linux**: Requires `amixer` (usually pre-installed)
  ```bash
  sudo apt-get install alsa-utils  # If missing
  ```

### Gemini API errors
- Verify your API key is correct
- Check API quota limits
- Ensure you have billing enabled (if required)

## Development

### Running in Development Mode

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Python daemon
cd daemon
./start.sh --debug
```

### Linting

```bash
npm run lint
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Webcam**: Webcam integration for React
- **Google Gemini AI**: Vision and language model
- **Python**: System control daemon
- **websockets**: WebSocket client library
- **pynput**: Cross-platform input control

## Future Enhancements

- [ ] WebSocket server implementation in Next.js
- [ ] More gesture types (swipe, pinch, rotation)
- [ ] Custom gesture training
- [ ] Multi-hand tracking
- [ ] Gesture macros and shortcuts
- [ ] Windows support for daemon
- [ ] Mobile app version
- [ ] Voice command integration

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Gemini AI