#!/usr/bin/env python3
"""
Tower Defense Game - Kingdom Rush Style
Main game file implementing all core systems
"""

import pygame
import sys
import math
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Tuple

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 700
TILE_SIZE = 30
GRID_WIDTH = 20
GRID_HEIGHT = 20
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (128, 128, 128)
LIGHT_GRAY = (200, 200, 200)
DARK_GRAY = (64, 64, 64)
GREEN = (0, 255, 0)
DARK_GREEN = (0, 128, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)
BROWN = (139, 69, 19)
PURPLE = (128, 0, 128)

# Game balance constants
STARTING_GOLD = 200
STARTING_LIVES = 20
GOLD_PER_KILL = 15


class GameState(Enum):
    MENU = 1
    PLAYING = 2
    BETWEEN_WAVES = 3
    GAME_OVER = 4
    VICTORY = 5


class TowerType(Enum):
    BASIC = 1
    RAPID = 2
    HEAVY = 3


@dataclass
class TowerStats:
    name: str
    cost: int
    damage: int
    fire_rate: float  # shots per second
    range: int  # in tiles
    color: Tuple[int, int, int]
    projectile_color: Tuple[int, int, int]


# Tower type definitions
TOWER_TYPES = {
    TowerType.BASIC: TowerStats("Basic Tower", 100, 15, 1.0, 3, BROWN, ORANGE),
    TowerType.RAPID: TowerStats("Rapid Tower", 150, 8, 3.0, 2, BLUE, YELLOW),
    TowerType.HEAVY: TowerStats("Heavy Tower", 250, 50, 0.5, 4, PURPLE, RED),
}


class Projectile:
    def __init__(self, x, y, target_x, target_y, damage, color, speed=5):
        self.x = x
        self.y = y
        self.target_x = target_x
        self.target_y = target_y
        self.damage = damage
        self.color = color
        self.speed = speed
        
        # Calculate direction
        dx = target_x - x
        dy = target_y - y
        dist = math.sqrt(dx**2 + dy**2)
        if dist > 0:
            self.vx = (dx / dist) * speed
            self.vy = (dy / dist) * speed
        else:
            self.vx = 0
            self.vy = 0
        
        self.active = True
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        
        # Check if reached target area
        dist = math.sqrt((self.x - self.target_x)**2 + (self.y - self.target_y)**2)
        if dist < 5:
            self.active = False
    
    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), 4)


class Tower:
    def __init__(self, grid_x, grid_y, tower_type: TowerType):
        self.grid_x = grid_x
        self.grid_y = grid_y
        self.tower_type = tower_type
        self.stats = TOWER_TYPES[tower_type]
        self.last_shot_time = 0
        self.target = None
    
    def get_screen_pos(self):
        return (self.grid_x * TILE_SIZE + TILE_SIZE // 2, 
                self.grid_y * TILE_SIZE + TILE_SIZE // 2)
    
    def can_shoot(self, current_time):
        cooldown = 1.0 / self.stats.fire_rate
        return current_time - self.last_shot_time >= cooldown
    
    def find_target(self, enemies):
        x, y = self.get_screen_pos()
        range_pixels = self.stats.range * TILE_SIZE
        
        closest_enemy = None
        closest_dist = float('inf')
        
        for enemy in enemies:
            if not enemy.alive:
                continue
            
            dist = math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2)
            if dist <= range_pixels and dist < closest_dist:
                closest_enemy = enemy
                closest_dist = dist
        
        return closest_enemy
    
    def shoot(self, target, current_time) -> Optional[Projectile]:
        if not self.can_shoot(current_time):
            return None
        
        self.last_shot_time = current_time
        x, y = self.get_screen_pos()
        
        return Projectile(x, y, target.x, target.y, 
                         self.stats.damage, self.stats.projectile_color)
    
    def draw(self, screen):
        x, y = self.get_screen_pos()
        
        # Draw range indicator (faded circle)
        range_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        range_pixels = self.stats.range * TILE_SIZE
        pygame.draw.circle(range_surface, (*self.stats.color, 30), (x, y), range_pixels)
        screen.blit(range_surface, (0, 0))
        
        # Draw tower
        pygame.draw.rect(screen, self.stats.color, 
                        (self.grid_x * TILE_SIZE + 5, self.grid_y * TILE_SIZE + 5, 
                         TILE_SIZE - 10, TILE_SIZE - 10))
        pygame.draw.rect(screen, BLACK, 
                        (self.grid_x * TILE_SIZE + 5, self.grid_y * TILE_SIZE + 5, 
                         TILE_SIZE - 10, TILE_SIZE - 10), 2)


class Enemy:
    def __init__(self, path, wave_number):
        self.path = path
        self.path_index = 0
        self.x = path[0][0] * TILE_SIZE + TILE_SIZE // 2
        self.y = path[0][1] * TILE_SIZE + TILE_SIZE // 2
        self.speed = 1.5 + (wave_number * 0.1)  # Increases with wave
        self.max_health = 50 + (wave_number * 10)
        self.health = self.max_health
        self.alive = True
        self.reached_end = False
    
    def update(self):
        if not self.alive or self.reached_end:
            return
        
        # Get target position
        if self.path_index >= len(self.path):
            self.reached_end = True
            return
        
        target_x = self.path[self.path_index][0] * TILE_SIZE + TILE_SIZE // 2
        target_y = self.path[self.path_index][1] * TILE_SIZE + TILE_SIZE // 2
        
        # Move towards target
        dx = target_x - self.x
        dy = target_y - self.y
        dist = math.sqrt(dx**2 + dy**2)
        
        if dist < self.speed:
            self.path_index += 1
        else:
            self.x += (dx / dist) * self.speed
            self.y += (dy / dist) * self.speed
    
    def take_damage(self, damage):
        self.health -= damage
        if self.health <= 0:
            self.alive = False
    
    def draw(self, screen):
        if not self.alive:
            return
        
        # Draw enemy
        pygame.draw.circle(screen, RED, (int(self.x), int(self.y)), 12)
        pygame.draw.circle(screen, BLACK, (int(self.x), int(self.y)), 12, 2)
        
        # Draw health bar
        bar_width = 24
        bar_height = 4
        bar_x = self.x - bar_width // 2
        bar_y = self.y - 20
        
        # Background
        pygame.draw.rect(screen, BLACK, (bar_x, bar_y, bar_width, bar_height))
        
        # Health
        health_width = int((self.health / self.max_health) * bar_width)
        if health_width > 0:
            pygame.draw.rect(screen, GREEN, (bar_x, bar_y, health_width, bar_height))


class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Tower Defense Game")
        self.clock = pygame.time.Clock()
        self.running = True
        self.font = pygame.font.Font(None, 32)
        self.small_font = pygame.font.Font(None, 24)
        
        # Game state
        self.state = GameState.BETWEEN_WAVES
        self.gold = STARTING_GOLD
        self.lives = STARTING_LIVES
        self.wave_number = 0
        self.max_waves = 10
        
        # Game objects
        self.path = self.create_path()
        self.towers = []
        self.enemies = []
        self.projectiles = []
        
        # UI state
        self.selected_tower_type = None
        self.hover_pos = None
        
        # Create path set for quick lookup
        self.path_set = set(self.path)
    
    def create_path(self):
        """Create a winding path from top-left to bottom-right"""
        path = []
        
        # Start from top
        path.extend([(1, y) for y in range(0, 5)])
        
        # Move right
        path.extend([(x, 5) for x in range(1, 10)])
        
        # Move down
        path.extend([(10, y) for y in range(5, 12)])
        
        # Move left
        path.extend([(x, 12) for x in range(10, 3, -1)])
        
        # Move down
        path.extend([(3, y) for y in range(12, 18)])
        
        # Move right to exit
        path.extend([(x, 18) for x in range(3, 20)])
        
        return path
    
    def can_place_tower(self, grid_x, grid_y):
        """Check if a tower can be placed at the given grid position"""
        if grid_x < 0 or grid_x >= GRID_WIDTH or grid_y < 0 or grid_y >= GRID_HEIGHT:
            return False
        
        # Can't place on path
        if (grid_x, grid_y) in self.path_set:
            return False
        
        # Can't place on existing tower
        for tower in self.towers:
            if tower.grid_x == grid_x and tower.grid_y == grid_y:
                return False
        
        return True
    
    def spawn_wave(self):
        """Spawn a new wave of enemies"""
        self.wave_number += 1
        enemies_count = 5 + self.wave_number  # 6-15 enemies per wave
        
        for i in range(enemies_count):
            enemy = Enemy(self.path, self.wave_number)
            self.enemies.append(enemy)
        
        self.state = GameState.PLAYING
    
    def update_game(self):
        """Update game logic"""
        current_time = pygame.time.get_ticks() / 1000.0
        
        # Update enemies
        for enemy in self.enemies[:]:
            if enemy.alive and not enemy.reached_end:
                enemy.update()
                
                # Check if enemy reached the end
                if enemy.reached_end:
                    self.lives -= 1
                    if self.lives <= 0:
                        self.state = GameState.GAME_OVER
        
        # Update towers and create projectiles
        for tower in self.towers:
            target = tower.find_target(self.enemies)
            if target:
                projectile = tower.shoot(target, current_time)
                if projectile:
                    self.projectiles.append(projectile)
        
        # Update projectiles and handle collisions
        for projectile in self.projectiles[:]:
            if not projectile.active:
                self.projectiles.remove(projectile)
                continue
            
            projectile.update()
            
            # Check collision with enemies
            for enemy in self.enemies:
                if not enemy.alive:
                    continue
                
                dist = math.sqrt((enemy.x - projectile.x)**2 + (enemy.y - projectile.y)**2)
                if dist < 15:
                    enemy.take_damage(projectile.damage)
                    projectile.active = False
                    
                    # Award gold if enemy dies
                    if not enemy.alive:
                        self.gold += GOLD_PER_KILL
                    break
        
        # Check if wave is complete
        if self.state == GameState.PLAYING:
            all_dead = all(not e.alive or e.reached_end for e in self.enemies)
            if all_dead and len(self.enemies) > 0:
                self.enemies.clear()
                self.projectiles.clear()
                
                if self.wave_number >= self.max_waves:
                    self.state = GameState.VICTORY
                else:
                    self.state = GameState.BETWEEN_WAVES
    
    def draw_grid(self):
        """Draw the game grid and path"""
        # Draw grid
        for x in range(GRID_WIDTH):
            for y in range(GRID_HEIGHT):
                rect = pygame.Rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                pygame.draw.rect(self.screen, LIGHT_GRAY, rect, 1)
        
        # Draw path
        for x, y in self.path:
            rect = pygame.Rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            pygame.draw.rect(self.screen, DARK_GRAY, rect)
        
        # Draw valid placement indicators when tower is selected
        if self.selected_tower_type and self.hover_pos:
            grid_x, grid_y = self.hover_pos
            if self.can_place_tower(grid_x, grid_y):
                rect = pygame.Rect(grid_x * TILE_SIZE, grid_y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                
                # Check if can afford
                stats = TOWER_TYPES[self.selected_tower_type]
                color = DARK_GREEN if self.gold >= stats.cost else RED
                
                surface = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                pygame.draw.rect(surface, (*color, 100), (0, 0, TILE_SIZE, TILE_SIZE))
                self.screen.blit(surface, (grid_x * TILE_SIZE, grid_y * TILE_SIZE))
    
    def draw_ui(self):
        """Draw user interface"""
        ui_x = GRID_WIDTH * TILE_SIZE + 10
        ui_y = 10
        
        # Draw UI background
        pygame.draw.rect(self.screen, LIGHT_GRAY, 
                        (GRID_WIDTH * TILE_SIZE, 0, 
                         SCREEN_WIDTH - GRID_WIDTH * TILE_SIZE, SCREEN_HEIGHT))
        
        # Gold display
        gold_text = self.font.render(f"Gold: {self.gold}", True, YELLOW)
        self.screen.blit(gold_text, (ui_x, ui_y))
        ui_y += 40
        
        # Lives display
        lives_text = self.font.render(f"Lives: {self.lives}", True, RED)
        self.screen.blit(lives_text, (ui_x, ui_y))
        ui_y += 40
        
        # Wave display
        wave_text = self.font.render(f"Wave: {self.wave_number}/{self.max_waves}", True, BLACK)
        self.screen.blit(wave_text, (ui_x, ui_y))
        ui_y += 60
        
        # Tower selection buttons
        title_text = self.small_font.render("Select Tower:", True, BLACK)
        self.screen.blit(title_text, (ui_x, ui_y))
        ui_y += 30
        
        for tower_type in TowerType:
            stats = TOWER_TYPES[tower_type]
            
            # Button background
            button_rect = pygame.Rect(ui_x, ui_y, 180, 80)
            
            # Highlight if selected
            if self.selected_tower_type == tower_type:
                pygame.draw.rect(self.screen, YELLOW, button_rect)
                pygame.draw.rect(self.screen, BLACK, button_rect, 3)
            else:
                pygame.draw.rect(self.screen, WHITE, button_rect)
                pygame.draw.rect(self.screen, BLACK, button_rect, 2)
            
            # Tower info
            name_text = self.small_font.render(stats.name, True, BLACK)
            cost_text = self.small_font.render(f"Cost: {stats.cost}", True, BLACK)
            dmg_text = self.small_font.render(f"Dmg: {stats.damage}", True, BLACK)
            
            # Color indicator
            pygame.draw.circle(self.screen, stats.color, (ui_x + 15, ui_y + 40), 10)
            
            self.screen.blit(name_text, (ui_x + 35, ui_y + 5))
            self.screen.blit(cost_text, (ui_x + 35, ui_y + 28))
            self.screen.blit(dmg_text, (ui_x + 35, ui_y + 51))
            
            # Store button rect for click detection
            if not hasattr(self, 'tower_buttons'):
                self.tower_buttons = {}
            self.tower_buttons[tower_type] = button_rect
            
            ui_y += 90
        
        # Start wave button
        if self.state == GameState.BETWEEN_WAVES:
            button_rect = pygame.Rect(ui_x, ui_y + 20, 180, 50)
            pygame.draw.rect(self.screen, GREEN, button_rect)
            pygame.draw.rect(self.screen, BLACK, button_rect, 2)
            
            button_text = self.font.render("START WAVE", True, BLACK)
            text_rect = button_text.get_rect(center=button_rect.center)
            self.screen.blit(button_text, text_rect)
            
            self.start_wave_button = button_rect
    
    def draw_game_over(self):
        """Draw game over screen"""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 180), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        self.screen.blit(overlay, (0, 0))
        
        # Game over text
        title_text = self.font.render("GAME OVER!", True, RED)
        title_rect = title_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50))
        self.screen.blit(title_text, title_rect)
        
        # Stats
        wave_text = self.small_font.render(f"Reached Wave: {self.wave_number}", True, WHITE)
        wave_rect = wave_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        self.screen.blit(wave_text, wave_rect)
        
        # Instructions
        restart_text = self.small_font.render("Press R to restart or Q to quit", True, WHITE)
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
        self.screen.blit(restart_text, restart_rect)
    
    def draw_victory(self):
        """Draw victory screen"""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 180), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        self.screen.blit(overlay, (0, 0))
        
        # Victory text
        title_text = self.font.render("VICTORY!", True, YELLOW)
        title_rect = title_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50))
        self.screen.blit(title_text, title_rect)
        
        # Stats
        lives_text = self.small_font.render(f"Lives Remaining: {self.lives}", True, WHITE)
        lives_rect = lives_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        self.screen.blit(lives_text, lives_rect)
        
        gold_text = self.small_font.render(f"Gold Remaining: {self.gold}", True, WHITE)
        gold_rect = gold_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 30))
        self.screen.blit(gold_text, gold_rect)
        
        # Instructions
        restart_text = self.small_font.render("Press R to restart or Q to quit", True, WHITE)
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 80))
        self.screen.blit(restart_text, restart_rect)
    
    def handle_click(self, pos):
        """Handle mouse clicks"""
        mouse_x, mouse_y = pos
        
        # Check tower selection buttons
        if hasattr(self, 'tower_buttons'):
            for tower_type, button_rect in self.tower_buttons.items():
                if button_rect.collidepoint(pos):
                    self.selected_tower_type = tower_type
                    return
        
        # Check start wave button
        if self.state == GameState.BETWEEN_WAVES and hasattr(self, 'start_wave_button'):
            if self.start_wave_button.collidepoint(pos):
                self.spawn_wave()
                return
        
        # Check tower placement
        if self.selected_tower_type and mouse_x < GRID_WIDTH * TILE_SIZE:
            grid_x = mouse_x // TILE_SIZE
            grid_y = mouse_y // TILE_SIZE
            
            if self.can_place_tower(grid_x, grid_y):
                stats = TOWER_TYPES[self.selected_tower_type]
                
                if self.gold >= stats.cost:
                    tower = Tower(grid_x, grid_y, self.selected_tower_type)
                    self.towers.append(tower)
                    self.gold -= stats.cost
    
    def handle_mouse_motion(self, pos):
        """Handle mouse movement"""
        mouse_x, mouse_y = pos
        
        if mouse_x < GRID_WIDTH * TILE_SIZE:
            grid_x = mouse_x // TILE_SIZE
            grid_y = mouse_y // TILE_SIZE
            self.hover_pos = (grid_x, grid_y)
        else:
            self.hover_pos = None
    
    def reset_game(self):
        """Reset game to initial state"""
        self.state = GameState.BETWEEN_WAVES
        self.gold = STARTING_GOLD
        self.lives = STARTING_LIVES
        self.wave_number = 0
        self.towers.clear()
        self.enemies.clear()
        self.projectiles.clear()
        self.selected_tower_type = None
    
    def run(self):
        """Main game loop"""
        while self.running:
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:  # Left click
                        self.handle_click(event.pos)
                elif event.type == pygame.MOUSEMOTION:
                    self.handle_mouse_motion(event.pos)
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_q:
                        self.running = False
                    elif event.key == pygame.K_r:
                        if self.state in [GameState.GAME_OVER, GameState.VICTORY]:
                            self.reset_game()
            
            # Update
            if self.state == GameState.PLAYING:
                self.update_game()
            
            # Draw
            self.screen.fill(WHITE)
            self.draw_grid()
            
            # Draw towers
            for tower in self.towers:
                tower.draw(self.screen)
            
            # Draw enemies
            for enemy in self.enemies:
                enemy.draw(self.screen)
            
            # Draw projectiles
            for projectile in self.projectiles:
                projectile.draw(self.screen)
            
            # Draw UI
            self.draw_ui()
            
            # Draw overlays
            if self.state == GameState.GAME_OVER:
                self.draw_game_over()
            elif self.state == GameState.VICTORY:
                self.draw_victory()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()
