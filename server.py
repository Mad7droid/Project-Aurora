#!/usr/bin/env python3
"""
KBot1 Physical Arm WebSocket Server
=====================================
Run this on your laptop when connected to the Arduino via USB.

Requirements:
  pip install websockets pyserial

Usage:
  python server.py
  python server.py --port 8765 --serial /dev/tty.usbmodem14101 --baud 115200
"""

import asyncio
import json
import argparse
import logging
import sys
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s  %(levelname)s  %(message)s')
log = logging.getLogger('kbot1')

try:
    import websockets
except ImportError:
    log.error("Missing dependency: pip install websockets")
    sys.exit(1)

# ── Optional: serial/Arduino ──────────────────────────────────────────────────
serial_port = None

def try_open_serial(port: str, baud: int):
    global serial_port
    try:
        import serial
        serial_port = serial.Serial(port, baud, timeout=1)
        log.info(f"Serial port open: {port} @ {baud} baud")
    except Exception as e:
        log.warning(f"Serial unavailable ({e}). Running in simulation-only mode.")

def send_to_arduino(payload: dict):
    """
    Convert the telemetry payload to a simple serial command and send it.
    Expected by Arduino: J0:145.2,J1:-32.5,J2:88.0,G:0\n
    """
    if not serial_port or not serial_port.is_open:
        return

    for arm_id, data in payload.items():
        cmd = f"ARM:{arm_id},J0:{data['base']},J1:{data['shoulder']},J2:{data['elbow']},G:{data['pincer']}\n"
        try:
            serial_port.write(cmd.encode())
            log.debug(f"→ Arduino: {cmd.strip()}")
        except Exception as e:
            log.warning(f"Serial write failed: {e}")


# ── WebSocket handler ─────────────────────────────────────────────────────────
connected_clients: set = set()

async def handler(websocket):
    connected_clients.add(websocket)
    remote = websocket.remote_address
    log.info(f"Client connected: {remote}")

    try:
        async for raw in websocket:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                log.warning(f"Bad JSON from {remote}: {raw[:80]}")
                continue

            msg_type = msg.get("type")

            if msg_type == "telemetry":
                data = msg.get("data", {})
                log.info(f"TELEMETRY  {json.dumps(data)}")
                send_to_arduino(data)

            elif msg_type == "llm_command":
                text = msg.get("text", "")
                log.info(f"LLM CMD    '{text}'")
                # TODO: pass to local LLM or rule engine and return joint sequence

            else:
                log.warning(f"Unknown message type: {msg_type}")

    except websockets.exceptions.ConnectionClosedOK:
        pass
    except websockets.exceptions.ConnectionClosedError as e:
        log.warning(f"Connection error: {e}")
    finally:
        connected_clients.discard(websocket)
        log.info(f"Client disconnected: {remote}")


# ── Entry point ───────────────────────────────────────────────────────────────
async def main(host: str, port: int):
    log.info(f"Starting KBot1 WS server on ws://{host}:{port}")
    async with websockets.serve(handler, host, port):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KBot1 WebSocket Server")
    parser.add_argument("--host",   default="localhost",    help="Bind host (default: localhost)")
    parser.add_argument("--port",   default=8765, type=int, help="Bind port (default: 8765)")
    parser.add_argument("--serial", default=None,           help="Serial port for Arduino, e.g. /dev/tty.usbmodem14101")
    parser.add_argument("--baud",   default=115200, type=int, help="Serial baud rate (default: 115200)")
    args = parser.parse_args()

    if args.serial:
        try_open_serial(args.serial, args.baud)

    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        log.info("Server stopped.")
