# Tower Defense Game - How to Play

## Installation

1. Install Python 3.7 or higher
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Game

```bash
python src/main.py
```

Or make it executable and run directly:
```bash
chmod +x src/main.py
./src/main.py
```

## How to Play

### Objective
Defend your base by preventing enemies from reaching the end of the path. Survive all 10 waves to win!

### Game Controls

- **Left Click**: Place selected tower or press UI buttons
- **Mouse Hover**: Preview tower placement (green = valid, red = can't afford)
- **R Key**: Restart game (on game over/victory screen)
- **Q Key**: Quit game

### Tower Types

1. **Basic Tower** (Cost: 100 gold)
   - Damage: 15
   - Fire Rate: 1.0 shots/sec
   - Range: 3 tiles
   - Good all-around choice

2. **Rapid Tower** (Cost: 150 gold)
   - Damage: 8
   - Fire Rate: 3.0 shots/sec
   - Range: 2 tiles
   - Great for weak, fast enemies

3. **Heavy Tower** (Cost: 250 gold)
   - Damage: 50
   - Fire Rate: 0.5 shots/sec
   - Range: 4 tiles
   - Best for tough enemies

### Game Mechanics

- **Starting Resources**: 200 gold, 20 lives
- **Gold**: Earn 15 gold per enemy killed
- **Lives**: Lose 1 life per enemy that reaches the end
- **Waves**: 10 waves total, getting progressively harder
- **Enemy Scaling**: Each wave has more enemies with more health and speed

### Strategy Tips

1. Place towers at corners and intersections for maximum coverage
2. Mix tower types for balanced defense
3. Start with Basic towers to build economy
4. Save for Heavy towers for later waves
5. Don't spend all your gold - save some for emergencies!

### UI Elements

- **Top Right Panel**: Shows gold, lives, and current wave
- **Tower Buttons**: Click to select tower type (highlighted in yellow when selected)
- **Start Wave Button**: Appears between waves - click to begin next wave
- **Game Grid**: Dark gray path, light gray buildable areas
- **Tower Range**: Faded circles show attack range when tower is placed

## Game Features

✅ 2D grid-based map (20x20 tiles)
✅ Wave system with 5-10+ enemies per wave
✅ Progressive difficulty (enemies get faster and tougher)
✅ 3 unique tower types
✅ Tower placement with valid area indicators
✅ Enemy pathfinding along preset winding path
✅ Visual projectiles
✅ Health/lives system
✅ Gold currency and economy
✅ Wave progression system
✅ Complete UI with all displays
✅ Game over and victory conditions

## Technical Details

- Engine: Pygame 2.5.2
- Resolution: 1000x700 pixels
- Grid Size: 20x20 tiles (30px per tile)
- FPS: 60
- Path: Winding path from top-left to bottom-right
