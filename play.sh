#!/bin/bash
# Quick start script for Tower Defense Game

echo "🏰 Tower Defense Game - Quick Start"
echo "===================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed!"
    echo "Please install Python 3.7 or higher from https://www.python.org/"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip is not installed!"
    echo "Please install pip (Python package manager)"
    exit 1
fi

echo "✓ pip found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Run the game
echo ""
echo "🎮 Starting game..."
echo ""
echo "Controls:"
echo "  - Left Click: Place towers, press buttons"
echo "  - Mouse Hover: Preview placement"
echo "  - R: Restart (on game over/victory)"
echo "  - Q: Quit"
echo ""
echo "Press Ctrl+C to exit"
echo ""

python3 src/main.py
