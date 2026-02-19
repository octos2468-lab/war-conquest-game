# 🏰 Tower Defense Game - Complete Implementation

A fully playable tower defense game built with Pygame, featuring wave-based gameplay, multiple tower types, and progressive difficulty.

## 🎮 Game Features

### ✅ Complete Feature List

1. **Grid-Based Map System**
   - 20x20 tile grid (600x600 pixels)
   - Preset winding path from spawn to exit
   - Visual grid and path indicators
   - Valid placement area highlighting

2. **Wave System**
   - 10 waves total
   - Progressive difficulty (more enemies, higher health, faster speed)
   - 5-10+ enemies per wave
   - Wave progression with start button

3. **Tower System**
   - **Basic Tower**: Balanced all-rounder (Cost: 100, Damage: 15, Rate: 1.0/s, Range: 3)
   - **Rapid Tower**: Fast firing (Cost: 150, Damage: 8, Rate: 3.0/s, Range: 2)
   - **Heavy Tower**: High damage (Cost: 250, Damage: 50, Rate: 0.5/s, Range: 4)
   - Click-to-place mechanics
   - Visual range indicators
   - Auto-targeting nearest enemy
   - Can't place on path or existing towers

4. **Enemy System**
   - Pathfinding along preset route
   - Health bars above enemies
   - Progressive scaling with waves
   - Visual movement along path

5. **Combat System**
   - Visual projectiles
   - Projectile travel and collision detection
   - Damage application and enemy death
   - Multiple projectiles in flight

6. **Economy System**
   - Starting gold: 200
   - Gold per kill: 15
   - Spend gold on towers
   - Real-time gold display

7. **Lives System**
   - Starting lives: 20
   - Lose 1 life per enemy that reaches the end
   - Game over at 0 lives
   - Lives display in UI

8. **User Interface**
   - Gold counter (top right)
   - Lives counter (top right)
   - Wave number display (top right)
   - Tower selection buttons with stats
   - Start Wave button
   - Victory screen (complete all 10 waves)
   - Game Over screen (lose all lives)

9. **Game States**
   - Between Waves (planning phase)
   - Playing (active combat)
   - Game Over (defeat)
   - Victory (all waves completed)

## 📋 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/octos2468-lab/war-conquest-game.git
cd war-conquest-game
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the game:
```bash
python src/main.py
```

## 🎯 How to Play

### Objective
Survive all 10 waves by preventing enemies from reaching your base!

### Controls
- **Left Click**: Place selected tower or interact with UI buttons
- **Mouse Movement**: Preview tower placement (green = valid, red = can't afford)
- **R Key**: Restart game (on game over/victory screens)
- **Q Key**: Quit game

### Gameplay Flow

1. **Planning Phase**
   - Select a tower type from the right panel
   - Place towers on valid tiles (not on the gray path)
   - Green highlight = valid placement and can afford
   - Red highlight = valid placement but can't afford
   - Click "START WAVE" when ready

2. **Combat Phase**
   - Towers automatically target and shoot nearest enemies
   - Enemies follow the path toward your base
   - Kill enemies to earn gold
   - Each enemy that reaches the end costs 1 life

3. **Between Waves**
   - Use earned gold to build more towers
   - Plan your strategy for the next wave
   - Waves get progressively harder

4. **End Conditions**
   - **Victory**: Complete all 10 waves with lives remaining
   - **Defeat**: Lose all 20 lives

### Tower Strategies

#### Basic Tower (100 gold)
- Best early game choice
- Reliable damage and range
- Good value for cost
- Place at strategic corners

#### Rapid Tower (150 gold)
- Great against many weak enemies
- Short range, so place close to path
- High DPS against low-HP targets
- Good for early path positions

#### Heavy Tower (250 gold)
- Expensive but powerful
- Long range covers large area
- Best against tough late-game enemies
- Place at intersections for maximum coverage

### Pro Tips

1. **Start with Basic Towers** - Build economy early
2. **Place at corners** - Enemies spend more time in range
3. **Cover the whole path** - Don't leave gaps
4. **Save 100-150 gold** - For emergency tower placement
5. **Mix tower types** - Balanced defense works best
6. **Heavy towers late** - Save for tough waves
7. **Watch your lives** - One mistake can cascade

## 📊 Game Balance

### Starting Resources
- Gold: 200
- Lives: 20

### Tower Stats
| Tower | Cost | Damage | Fire Rate | Range | DPS |
|-------|------|--------|-----------|-------|-----|
| Basic | 100  | 15     | 1.0/s     | 3     | 15  |
| Rapid | 150  | 8      | 3.0/s     | 2     | 24  |
| Heavy | 250  | 50     | 0.5/s     | 4     | 25  |

### Enemy Scaling (per wave)
- Health: 50 + (wave × 10)
- Speed: 1.5 + (wave × 0.1)
- Count: 5 + wave number

### Economy
- Gold per kill: 15
- Can earn: ~90-150 gold per wave (depending on kills)

## 🧪 Testing

Run the test suite to verify all game mechanics:

```bash
python test_game.py
```

Run the gameplay demo (headless simulation):

```bash
python demo_game.py
```

## 🏗️ Technical Details

### Architecture
- **Engine**: Pygame 2.5.2
- **Language**: Python 3
- **Resolution**: 1000x700 pixels
- **Grid**: 20x20 tiles (30px per tile)
- **FPS**: 60

### File Structure
```
war-conquest-game/
├── src/
│   └── main.py              # Main game implementation
├── requirements.txt          # Python dependencies
├── test_game.py             # Test suite
├── demo_game.py             # Gameplay demo
├── GAME_INSTRUCTIONS.md     # Player instructions
└── README_IMPLEMENTATION.md # This file
```

### Key Classes
- `Game`: Main game controller and loop
- `Tower`: Tower logic and shooting
- `Enemy`: Enemy movement and health
- `Projectile`: Projectile movement and collision
- `GameState`: Enum for game states
- `TowerType`: Enum for tower types

## 🎨 Visual Design

### Color Scheme
- **Path**: Dark gray (enemies walk here)
- **Grid**: Light gray lines
- **Basic Tower**: Brown
- **Rapid Tower**: Blue
- **Heavy Tower**: Purple
- **Enemies**: Red with black outline
- **Health Bars**: Green on black
- **Projectiles**: Match tower color
- **UI**: Light gray panel

### UI Layout
- **Left Side** (600x700): Game grid and gameplay
- **Right Side** (400x700): UI panel with stats and controls
- **Top**: Gold, Lives, Wave number
- **Middle**: Tower selection buttons
- **Bottom**: Start Wave button (when available)

## 📈 Development Status

### ✅ Completed Features
- ✅ Complete grid-based map system
- ✅ Enemy pathfinding
- ✅ Tower placement and targeting
- ✅ Three unique tower types
- ✅ Wave spawning system
- ✅ Progressive difficulty
- ✅ Visual projectiles
- ✅ Health and lives system
- ✅ Gold economy
- ✅ Complete UI
- ✅ Game over and victory conditions
- ✅ Restart functionality
- ✅ Test suite

### 🎯 Future Enhancements (Optional)
- Tower upgrades
- More tower types
- More enemy types
- Special abilities
- Sound effects and music
- Particle effects
- High score system
- Multiple maps
- Difficulty levels

## 🐛 Known Limitations

1. No audio/sound effects (Pygame audio can be added)
2. No save/load system (single session gameplay)
3. Fixed map (no procedural generation)
4. No tower selling/refunds

## 🤝 Contributing

This game was created as part of the War Conquest Game project. See the main repository documentation for contribution guidelines.

## 📄 License

Part of the War Conquest Game project.

---

**Built with Pygame** 🎮

*For more information about the larger War Conquest project, see the main [README.md](README.md)*
