#!/usr/bin/env python3
"""
Haptic Desktop Controller Daemon
WebSocket client for receiving gesture commands and executing OS controls
Supports macOS and Linux
"""

import asyncio
import json
import logging
import platform
import sys
from typing import Optional

try:
    import websockets
    from pynput.keyboard import Key, Controller as KeyboardController
    from pynput.mouse import Controller as MouseController
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install websockets pynput")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GestureController:
    """Handles gesture-to-action mapping and execution"""
    
    def __init__(self):
        self.keyboard = KeyboardController()
        self.mouse = MouseController()
        self.system = platform.system()
        logger.info(f"Initialized GestureController for {self.system}")
    
    def execute_gesture(self, gesture: str) -> None:
        """Execute the appropriate action for a gesture"""
        try:
            if gesture == "scroll_up":
                self._scroll_up()
            elif gesture == "scroll_down":
                self._scroll_down()
            elif gesture == "volume_up":
                self._volume_up()
            elif gesture == "volume_down":
                self._volume_down()
            elif gesture == "idle":
                pass  # No action for idle
            else:
                logger.warning(f"Unknown gesture: {gesture}")
        except Exception as e:
            logger.error(f"Error executing gesture '{gesture}': {e}")
    
    def _scroll_up(self) -> None:
        """Scroll up"""
        logger.info("Scrolling up")
        # Mouse scroll simulation (positive values scroll up)
        self.mouse.scroll(0, 3)
    
    def _scroll_down(self) -> None:
        """Scroll down"""
        logger.info("Scrolling down")
        # Simulate mouse wheel scroll down
        self.mouse.scroll(0, -3)
    
    def _volume_up(self) -> None:
        """Increase system volume"""
        logger.info("Volume up")
        if self.system == "Darwin":  # macOS
            import subprocess
            subprocess.run(["osascript", "-e", "set volume output volume ((output volume of (get volume settings)) + 5)"])
        elif self.system == "Linux":
            import subprocess
            subprocess.run(["amixer", "-D", "pulse", "sset", "Master", "5%+"])
        else:
            logger.warning(f"Volume control not supported on {self.system}")
    
    def _volume_down(self) -> None:
        """Decrease system volume"""
        logger.info("Volume down")
        if self.system == "Darwin":  # macOS
            import subprocess
            subprocess.run(["osascript", "-e", "set volume output volume ((output volume of (get volume settings)) - 5)"])
        elif self.system == "Linux":
            import subprocess
            subprocess.run(["amixer", "-D", "pulse", "sset", "Master", "5%-"])
        else:
            logger.warning(f"Volume control not supported on {self.system}")


class WebSocketClient:
    """WebSocket client for receiving gesture commands"""
    
    def __init__(self, uri: str = "ws://localhost:3000/ws"):
        self.uri = uri
        self.controller = GestureController()
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
    
    async def connect(self) -> None:
        """Connect to WebSocket server and listen for messages"""
        retry_delay = 5
        
        while True:
            try:
                logger.info(f"Connecting to {self.uri}...")
                async with websockets.connect(self.uri) as websocket:
                    self.websocket = websocket
                    logger.info("Connected to WebSocket server")
                    
                    await self._listen()
                    
            except websockets.exceptions.WebSocketException as e:
                logger.error(f"WebSocket error: {e}")
            except ConnectionRefusedError:
                logger.warning(f"Connection refused. Retrying in {retry_delay}s...")
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
            
            # Wait before reconnecting
            await asyncio.sleep(retry_delay)
    
    async def _listen(self) -> None:
        """Listen for incoming messages"""
        try:
            async for message in self.websocket:
                await self._handle_message(message)
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Connection closed")
    
    async def _handle_message(self, message: str) -> None:
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)
            
            if data.get("type") == "gesture":
                gesture = data.get("gesture")
                if gesture:
                    logger.debug(f"Received gesture: {gesture}")
                    self.controller.execute_gesture(gesture)
            
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON message: {message}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")


async def main():
    """Main entry point"""
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description="Haptic Desktop Controller Daemon")
    parser.add_argument(
        "--uri",
        default="ws://localhost:3000/ws",
        help="WebSocket server URI (default: ws://localhost:3000/ws)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    logger.info("Starting Haptic Desktop Controller Daemon")
    logger.info(f"Platform: {platform.system()} {platform.release()}")
    
    client = WebSocketClient(uri=args.uri)
    
    try:
        await client.connect()
    except KeyboardInterrupt:
        logger.info("Shutting down...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Daemon stopped")
