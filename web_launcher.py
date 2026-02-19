#!/usr/bin/env python3
"""Windows launcher for the browser-based game.

When packaged as an .exe, this starts a local HTTP server for the bundled
web files and opens the game in the default browser.
"""

from __future__ import annotations

import socket
import sys
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def get_web_dir() -> Path:
    if getattr(sys, "frozen", False):
        base_path = Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent))
    else:
        base_path = Path(__file__).resolve().parent

    web_dir = base_path / "web"
    if not web_dir.exists():
        raise FileNotFoundError("Could not find the 'web' folder next to launcher resources.")
    return web_dir


def main() -> int:
    try:
        web_dir = get_web_dir()
    except Exception as error:
        print(f"Failed to locate web assets: {error}")
        return 1

    port = find_free_port()
    handler = partial(SimpleHTTPRequestHandler, directory=str(web_dir))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)

    url = f"http://127.0.0.1:{port}"
    print("War Conquest Web Launcher")
    print("=" * 28)
    print(f"Serving: {web_dir}")
    print(f"Game URL: {url}")
    print("Browser should open automatically.")
    print("Close this window to stop the game server.")

    threading.Timer(0.25, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
