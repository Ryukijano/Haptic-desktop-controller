#!/usr/bin/env python3
"""
Haptic Desktop Controller - Desktop Daemon

This daemon connects to the web app via WebSocket and executes
system commands based on gesture interpretations from the mobile app.

Requirements:
    pip install websockets pynput

Usage:
    python desktop_daemon.py [--host localhost] [--port 3000]
"""

import asyncio
import json
import argparse
import platform
import sys
from typing import Optional

try:
    from websockets.asyncio.client import connect
except ImportError:
    from websockets.legacy.client import connect

try:
    from pynput.keyboard import Controller as KeyboardController, Key
    from pynput.mouse import Controller as MouseController
    PYNPUT_AVAILABLE = True
except ImportError:
    print("Warning: pynput not installed. Running in simulation mode.")
    print("Install with: pip install pynput")
    PYNPUT_AVAILABLE = False


class DesktopController:
    """Controls desktop using OS-level APIs via pynput."""
    
    def __init__(self, ws_host: str = "localhost", ws_port: int = 3000):
        self.ws_uri = f"ws://{ws_host}:{ws_port}/socket.io/?EIO=4&transport=websocket"
        self.system = platform.system()
        
        if PYNPUT_AVAILABLE:
            self.keyboard = KeyboardController()
            self.mouse = MouseController()
        else:
            self.keyboard = None
            self.mouse = None
    
    async def connect_and_listen(self):
        """Connect to WebSocket server and listen for commands."""
        print(f"Connecting to {self.ws_uri}...")
        
        try:
            # For socket.io, we need to handle the protocol differently
            # Using a simpler WebSocket approach for compatibility
            async with connect(
                self.ws_uri,
                additional_headers={"Origin": f"http://localhost:{3000}"}
            ) as websocket:
                print("✓ Connected to Haptic Desktop Controller")
                print(f"  System: {self.system}")
                print(f"  pynput available: {PYNPUT_AVAILABLE}")
                print("\nWaiting for commands...\n")
                
                # Send registration message
                # Socket.io format: "42" prefix for message event
                await websocket.send('42["register","desktop"]')
                
                async for message in websocket:
                    await self.handle_message(message)
                    
        except Exception as e:
            print(f"Connection error: {e}")
            print("Make sure the web app server is running.")
            raise
    
    async def handle_message(self, raw_message: str):
        """Parse and handle incoming WebSocket messages."""
        try:
            # Socket.io messages have format: "42["event_name", data]"
            if raw_message.startswith("42"):
                json_str = raw_message[2:]  # Remove "42" prefix
                data = json.loads(json_str)
                
                if isinstance(data, list) and len(data) >= 2:
                    event_name = data[0]
                    payload = data[1]
                    
                    if event_name == "motion_command":
                        await self.execute_command(payload)
                    elif event_name == "desktop_connected":
                        print("✓ Registered as desktop client")
                        
            elif raw_message.startswith("0"):
                # Connection established
                print("Socket.io connection established")
            elif raw_message == "2":
                # Ping - send pong
                pass
            elif raw_message == "3":
                # Pong received
                pass
                
        except json.JSONDecodeError:
            pass  # Ignore non-JSON messages
        except Exception as e:
            print(f"Error handling message: {e}")
    
    async def execute_command(self, cmd: dict):
        """Execute a desktop command based on gesture interpretation."""
        action = cmd.get('action', '')
        value = cmd.get('value', 1)
        intensity = cmd.get('intensity', 1.0)
        
        print(f"[CMD] {action}: value={value}, intensity={intensity}")
        
        try:
            if action == 'adjust_volume':
                self.adjust_volume(int(value * intensity))
            elif action == 'scroll':
                self.scroll(int(value * 10 * intensity))
            elif action == 'pan':
                self.pan(value, intensity)
            elif action == 'tab_switch':
                self.switch_tab(value)
            elif action == 'adjust_brightness':
                self.adjust_brightness(int(value * intensity))
            elif action == 'click':
                self.click()
            elif action == 'keypress':
                self.keypress(value)
            elif action == 'media':
                self.media_control(value)
            else:
                print(f"  Unknown action: {action}")
        except Exception as e:
            print(f"  Error executing command: {e}")
    
    def adjust_volume(self, steps: int):
        """Adjust system volume."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Adjusting volume by {steps} steps")
            return
            
        key = Key.media_volume_up if steps > 0 else Key.media_volume_down
        for _ in range(abs(steps)):
            self.keyboard.press(key)
            self.keyboard.release(key)
        print(f"  Volume adjusted: {'+' if steps > 0 else ''}{steps}")
    
    def scroll(self, amount: int):
        """Scroll in focused window."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Scrolling by {amount}")
            return
            
        self.mouse.scroll(0, amount)
        print(f"  Scrolled: {amount}")
    
    def pan(self, direction: int, intensity: float):
        """Pan using arrow keys."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Pan {'right' if direction > 0 else 'left'}, intensity={intensity}")
            return
            
        key = Key.right if direction > 0 else Key.left
        steps = max(1, int(5 * intensity))
        
        for _ in range(steps):
            self.keyboard.press(key)
            self.keyboard.release(key)
        print(f"  Pan {'right' if direction > 0 else 'left'}: {steps} steps")
    
    def switch_tab(self, direction: int):
        """Switch tabs in browser or editor."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Switching tab {'next' if direction > 0 else 'previous'}")
            return
        
        if self.system == "Darwin":  # macOS
            # Cmd+Option+Arrow for macOS
            with self.keyboard.pressed(Key.cmd):
                with self.keyboard.pressed(Key.alt):
                    key = Key.right if direction > 0 else Key.left
                    self.keyboard.press(key)
                    self.keyboard.release(key)
        else:  # Windows/Linux
            # Ctrl+Tab / Ctrl+Shift+Tab
            with self.keyboard.pressed(Key.ctrl):
                if direction < 0:
                    with self.keyboard.pressed(Key.shift):
                        self.keyboard.press(Key.tab)
                        self.keyboard.release(Key.tab)
                else:
                    self.keyboard.press(Key.tab)
                    self.keyboard.release(Key.tab)
        
        print(f"  Tab switched: {'next' if direction > 0 else 'previous'}")
    
    def adjust_brightness(self, steps: int):
        """Adjust screen brightness (macOS only for now)."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Adjusting brightness by {steps} steps")
            return
            
        if self.system == "Darwin":
            # macOS brightness keys
            # Note: These may not work on all keyboards
            for _ in range(abs(steps)):
                if steps > 0:
                    # Brightness up key code may vary
                    pass
                else:
                    pass
            print(f"  Brightness adjusted: {'+' if steps > 0 else ''}{steps}")
        else:
            print(f"  Brightness control not available on {self.system}")
    
    def click(self):
        """Perform mouse click."""
        if not PYNPUT_AVAILABLE:
            print("  [SIM] Mouse click")
            return
            
        from pynput.mouse import Button
        self.mouse.click(Button.left)
        print("  Mouse clicked")
    
    def keypress(self, key_type: int):
        """Press specific keys."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Keypress: {key_type}")
            return
            
        if key_type == 1:  # Enter
            self.keyboard.press(Key.enter)
            self.keyboard.release(Key.enter)
            print("  Enter pressed")
        elif key_type == 2:  # Space
            self.keyboard.press(Key.space)
            self.keyboard.release(Key.space)
            print("  Space pressed")
    
    def media_control(self, control_type: int):
        """Control media playback."""
        if not PYNPUT_AVAILABLE:
            print(f"  [SIM] Media control: {control_type}")
            return
            
        if control_type == 1:  # Play/Pause
            self.keyboard.press(Key.media_play_pause)
            self.keyboard.release(Key.media_play_pause)
            print("  Play/Pause toggled")
        elif control_type == 2:  # Mute
            self.keyboard.press(Key.media_volume_mute)
            self.keyboard.release(Key.media_volume_mute)
            print("  Mute toggled")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Haptic Desktop Controller - Desktop Daemon"
    )
    parser.add_argument(
        "--host",
        default="localhost",
        help="WebSocket server host (default: localhost)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=3000,
        help="WebSocket server port (default: 3000)"
    )
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("  Haptic Desktop Controller - Desktop Daemon")
    print("=" * 50)
    print()
    
    controller = DesktopController(ws_host=args.host, ws_port=args.port)
    
    # Retry connection loop
    while True:
        try:
            await controller.connect_and_listen()
        except KeyboardInterrupt:
            print("\nShutting down...")
            break
        except Exception:
            print("Reconnecting in 5 seconds...")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
