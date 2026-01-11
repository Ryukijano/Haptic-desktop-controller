#!/usr/bin/env python3
"""
Haptic Desktop Controller Daemon
Socket.io client for receiving gesture commands and executing OS controls
Supports macOS and Linux
"""

import logging
import platform
import sys
import time

try:
    import socketio
    from pynput.keyboard import Key, Controller as KeyboardController
    from pynput.mouse import Controller as MouseController
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install python-socketio[client] pynput")
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


class SocketIOClient:
    """Socket.io client for receiving gesture commands"""
    
    def __init__(self, url: str = "http://localhost:3000"):
        self.url = url
        self.controller = GestureController()
        self.sio = socketio.Client(logger=False, engineio_logger=False)
        
        # Register event handlers
        @self.sio.event
        def connect():
            logger.info("Connected to Socket.io server")
        
        @self.sio.event
        def disconnect():
            logger.warning("Disconnected from Socket.io server")
        
        @self.sio.event
        def gesture(data):
            """Handle incoming gesture events"""
            try:
                gesture_name = data.get('gesture')
                if gesture_name:
                    logger.debug(f"Received gesture: {gesture_name}")
                    self.controller.execute_gesture(gesture_name)
            except Exception as e:
                logger.error(f"Error handling gesture: {e}")
    
    def connect(self) -> None:
        """Connect to Socket.io server"""
        retry_delay = 5
        
        while True:
            try:
                logger.info(f"Connecting to {self.url}...")
                self.sio.connect(self.url, wait_timeout=10)
                logger.info("Connected successfully")
                self.sio.wait()
                
            except Exception as e:
                logger.error(f"Connection error: {e}")
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)


def main():
    """Main entry point"""
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description="Haptic Desktop Controller Daemon")
    parser.add_argument(
        "--url",
        default="http://localhost:3000",
        help="Socket.io server URL (default: http://localhost:3000)"
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
    
    client = SocketIOClient(url=args.url)
    
    try:
        client.connect()
    except KeyboardInterrupt:
        logger.info("Shutting down...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Daemon stopped")
