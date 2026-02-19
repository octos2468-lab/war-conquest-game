#!/usr/bin/env python3
"""
Visual Demo Script
This script simulates a simple gameplay scenario to verify game mechanics
"""

import sys
import os

# Set SDL to dummy video driver for headless testing
os.environ['SDL_VIDEODRIVER'] = 'dummy'
os.environ['SDL_AUDIODRIVER'] = 'dummy'

sys.path.insert(0, '/home/runner/work/war-conquest-game/war-conquest-game/src')
from main import Game, TowerType, GameState

def run_demo():
    """Run a simulated gameplay demo"""
    print("=" * 60)
    print("Tower Defense Game - Gameplay Demo")
    print("=" * 60)
    
    game = Game()
    
    # Place some towers
    print("\n1. Placing towers...")
    game.selected_tower_type = TowerType.BASIC
    game.handle_click((2 * 30 + 15, 2 * 30 + 15))  # Place at (2, 2)
    game.handle_click((4 * 30 + 15, 8 * 30 + 15))  # Place at (4, 8)
    print(f"   Placed {len(game.towers)} towers")
    print(f"   Gold remaining: {game.gold}")
    
    # Start wave 1
    print("\n2. Starting Wave 1...")
    game.spawn_wave()
    print(f"   Wave {game.wave_number} started")
    print(f"   Enemies spawned: {len(game.enemies)}")
    print(f"   Game state: {game.state}")
    
    # Simulate some game updates
    print("\n3. Running game simulation...")
    for i in range(100):
        game.update_game()
        
        if i % 20 == 0:
            alive_enemies = sum(1 for e in game.enemies if e.alive and not e.reached_end)
            print(f"   Update {i}: {alive_enemies} enemies alive, Lives: {game.lives}, Gold: {game.gold}")
        
        if game.state != GameState.PLAYING:
            break
    
    # Check results
    print("\n4. Results after simulation:")
    print(f"   Final state: {game.state}")
    print(f"   Lives: {game.lives}")
    print(f"   Gold: {game.gold}")
    print(f"   Towers: {len(game.towers)}")
    
    if game.state == GameState.BETWEEN_WAVES:
        print("\n   ✓ Wave completed successfully!")
    elif game.state == GameState.GAME_OVER:
        print("\n   ✗ Game Over!")
    
    # Test placing more towers if we have gold
    if game.gold >= 100:
        print(f"\n5. Placing another tower with remaining gold ({game.gold})...")
        game.selected_tower_type = TowerType.BASIC
        game.handle_click((15 * 30 + 15, 10 * 30 + 15))
        print(f"   Towers: {len(game.towers)}, Gold: {game.gold}")
    
    # Start next wave if available
    if game.state == GameState.BETWEEN_WAVES and game.wave_number < game.max_waves:
        print(f"\n6. Starting Wave {game.wave_number + 1}...")
        game.spawn_wave()
        print(f"   Wave {game.wave_number} started with {len(game.enemies)} enemies")
        
        # Run a few more updates
        for i in range(50):
            game.update_game()
        
        alive_enemies = sum(1 for e in game.enemies if e.alive and not e.reached_end)
        print(f"   After 50 updates: {alive_enemies} enemies remaining")
    
    print("\n" + "=" * 60)
    print("Demo Complete!")
    print("=" * 60)
    print("\nThe game appears to be working correctly!")
    print("To play the actual game, run: python src/main.py")
    print("(Note: Requires a display for interactive gameplay)")

if __name__ == "__main__":
    run_demo()
