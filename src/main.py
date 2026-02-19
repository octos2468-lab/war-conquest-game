#!/usr/bin/env python3
"""
War Conquest - Tower Defense Phase
Army-post based defense with hero abilities.
"""

import math
import sys
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple

import pygame

pygame.init()

SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 700
TILE_SIZE = 30
GRID_WIDTH = 20
GRID_HEIGHT = 20
FPS = 60

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
CYAN = (0, 200, 200)

STARTING_GOLD = 220
STARTING_LIVES = 20
MAX_WAVES = 10


class GameState(Enum):
    MENU = 1
    PLAYING = 2
    BETWEEN_WAVES = 3
    GAME_OVER = 4
    VICTORY = 5


class TowerType(Enum):
    ARCHER_POST = 1
    SOLDIER_BARRACKS = 2


class EnemyType(Enum):
    MILITIA = 1
    RAIDER = 2
    BRUTE = 3


@dataclass
class TowerStats:
    name: str
    cost: int
    damage: int
    fire_rate: float
    range: int
    color: Tuple[int, int, int]
    projectile_color: Tuple[int, int, int]


@dataclass
class EnemyStats:
    name: str
    health_mult: float
    speed_mult: float
    reward: int
    color: Tuple[int, int, int]
    radius: int


TOWER_TYPES = {
    TowerType.ARCHER_POST: TowerStats("Archer Post", 110, 14, 1.8, 4, BROWN, ORANGE),
    TowerType.SOLDIER_BARRACKS: TowerStats("Soldier Barracks", 140, 24, 1.0, 2, BLUE, CYAN),
}

ENEMY_TYPES = {
    EnemyType.MILITIA: EnemyStats("Militia", 0.9, 1.25, 12, RED, 10),
    EnemyType.RAIDER: EnemyStats("Raider", 1.0, 1.0, 15, ORANGE, 12),
    EnemyType.BRUTE: EnemyStats("Brute", 1.8, 0.72, 25, PURPLE, 14),
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

        dist = math.sqrt((self.x - self.target_x) ** 2 + (self.y - self.target_y) ** 2)
        if dist < 5:
            self.active = False

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), 4)


class ArmyPost:
    def __init__(self, grid_x, grid_y, tower_type: TowerType):
        self.grid_x = grid_x
        self.grid_y = grid_y
        self.tower_type = tower_type
        self.stats = TOWER_TYPES[tower_type]
        self.last_shot_time = 0.0

    def get_screen_pos(self):
        return (
            self.grid_x * TILE_SIZE + TILE_SIZE // 2,
            self.grid_y * TILE_SIZE + TILE_SIZE // 2,
        )

    def can_shoot(self, current_time: float):
        cooldown = 1.0 / self.stats.fire_rate
        return current_time - self.last_shot_time >= cooldown

    def find_target(self, enemies):
        x, y = self.get_screen_pos()
        range_pixels = self.stats.range * TILE_SIZE

        closest_enemy = None
        closest_dist = float("inf")

        for enemy in enemies:
            if not enemy.alive or enemy.reached_end or enemy.spawn_delay > 0:
                continue

            dist = math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
            if dist <= range_pixels and dist < closest_dist:
                closest_enemy = enemy
                closest_dist = dist

        return closest_enemy

    def shoot(self, target, current_time, damage_multiplier=1.0) -> Optional[Projectile]:
        if not self.can_shoot(current_time):
            return None

        self.last_shot_time = current_time
        x, y = self.get_screen_pos()

        damage = int(self.stats.damage * damage_multiplier)
        speed = 6 if self.tower_type == TowerType.ARCHER_POST else 4
        return Projectile(x, y, target.x, target.y, damage, self.stats.projectile_color, speed)

    def draw(self, screen, rally_active=False):
        x, y = self.get_screen_pos()

        range_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        range_pixels = self.stats.range * TILE_SIZE
        alpha = 45 if rally_active else 30
        pygame.draw.circle(range_surface, (*self.stats.color, alpha), (x, y), range_pixels)
        screen.blit(range_surface, (0, 0))

        pygame.draw.rect(
            screen,
            self.stats.color,
            (
                self.grid_x * TILE_SIZE + 5,
                self.grid_y * TILE_SIZE + 5,
                TILE_SIZE - 10,
                TILE_SIZE - 10,
            ),
        )
        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.grid_x * TILE_SIZE + 5,
                self.grid_y * TILE_SIZE + 5,
                TILE_SIZE - 10,
                TILE_SIZE - 10,
            ),
            2,
        )

        if rally_active:
            pygame.draw.circle(screen, YELLOW, (int(x), int(y)), 5)


class Enemy:
    def __init__(self, path, wave_number, enemy_type: EnemyType, spawn_delay=0.0):
        self.path = path
        self.path_index = 0
        self.x = path[0][0] * TILE_SIZE + TILE_SIZE // 2
        self.y = path[0][1] * TILE_SIZE + TILE_SIZE // 2

        enemy_stats = ENEMY_TYPES[enemy_type]
        self.enemy_type = enemy_type
        self.enemy_stats = enemy_stats

        base_speed = 1.4 + (wave_number * 0.1)
        base_health = 45 + (wave_number * 11)

        self.speed = base_speed * enemy_stats.speed_mult
        self.max_health = int(base_health * enemy_stats.health_mult)
        self.health = self.max_health
        self.reward = enemy_stats.reward
        self.radius = enemy_stats.radius

        self.alive = True
        self.reached_end = False
        self.spawn_delay = spawn_delay

    def update(self, dt):
        if not self.alive or self.reached_end:
            return

        if self.spawn_delay > 0:
            self.spawn_delay -= dt
            return

        if self.path_index >= len(self.path):
            self.reached_end = True
            return

        target_x = self.path[self.path_index][0] * TILE_SIZE + TILE_SIZE // 2
        target_y = self.path[self.path_index][1] * TILE_SIZE + TILE_SIZE // 2

        dx = target_x - self.x
        dy = target_y - self.y
        dist = math.sqrt(dx**2 + dy**2)

        step = self.speed * dt * 60
        if dist < step:
            self.path_index += 1
        elif dist > 0:
            self.x += (dx / dist) * step
            self.y += (dy / dist) * step

    def take_damage(self, damage):
        self.health -= damage
        if self.health <= 0:
            self.alive = False

    def retreat(self, tiles_back=6):
        self.path_index = max(0, self.path_index - tiles_back)
        target_x = self.path[self.path_index][0] * TILE_SIZE + TILE_SIZE // 2
        target_y = self.path[self.path_index][1] * TILE_SIZE + TILE_SIZE // 2
        self.x = target_x
        self.y = target_y

    def draw(self, screen):
        if not self.alive or self.spawn_delay > 0:
            return

        pygame.draw.circle(screen, self.enemy_stats.color, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(screen, BLACK, (int(self.x), int(self.y)), self.radius, 2)

        bar_width = max(24, self.radius * 2)
        bar_height = 4
        bar_x = self.x - bar_width // 2
        bar_y = self.y - self.radius - 10

        pygame.draw.rect(screen, BLACK, (bar_x, bar_y, bar_width, bar_height))

        health_width = int((self.health / self.max_health) * bar_width)
        if health_width > 0:
            pygame.draw.rect(screen, GREEN, (bar_x, bar_y, health_width, bar_height))


class Hero:
    def __init__(self, path):
        mid_idx = len(path) // 2
        self.grid_x, self.grid_y = path[mid_idx]
        self.x = self.grid_x * TILE_SIZE + TILE_SIZE // 2
        self.y = self.grid_y * TILE_SIZE + TILE_SIZE // 2

        self.attack_damage = 18
        self.attack_range = 3 * TILE_SIZE
        self.attack_cooldown = 0.9
        self.last_attack_time = 0.0

        self.slash_damage = 30
        self.slash_range = 2 * TILE_SIZE
        self.slash_cooldown = 3.0
        self.last_slash_time = -99.0

        self.rally_cooldown = 10.0
        self.rally_duration = 4.5
        self.rally_multiplier = 1.35
        self.last_rally_time = -99.0
        self.rally_until = 0.0

        self.escape_cooldown = 14.0
        self.last_escape_time = -99.0
        self.escape_charges = 0

    def get_status(self, now):
        slash_ready = max(0.0, self.slash_cooldown - (now - self.last_slash_time))
        rally_ready = max(0.0, self.rally_cooldown - (now - self.last_rally_time))
        escape_ready = max(0.0, self.escape_cooldown - (now - self.last_escape_time))
        return slash_ready, rally_ready, escape_ready


class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("War Conquest - Army Defense")
        self.clock = pygame.time.Clock()
        self.running = True
        self.font = pygame.font.Font(None, 32)
        self.small_font = pygame.font.Font(None, 24)

        self.state = GameState.BETWEEN_WAVES
        self.gold = STARTING_GOLD
        self.lives = STARTING_LIVES
        self.wave_number = 0
        self.max_waves = MAX_WAVES
        self.army_xp = 0

        self.path = self.create_path()
        self.posts: List[ArmyPost] = []
        self.enemies: List[Enemy] = []
        self.projectiles: List[Projectile] = []
        self.hero = Hero(self.path)

        self.selected_tower_type: Optional[TowerType] = None
        self.hover_pos = None

        self.path_set = set(self.path)
        self.tower_buttons = {}
        self.start_wave_button = None

    @property
    def towers(self):
        return self.posts

    def create_path(self):
        path = []
        path.extend([(1, y) for y in range(0, 5)])
        path.extend([(x, 5) for x in range(1, 10)])
        path.extend([(10, y) for y in range(5, 12)])
        path.extend([(x, 12) for x in range(10, 3, -1)])
        path.extend([(3, y) for y in range(12, 18)])
        path.extend([(x, 18) for x in range(3, 20)])
        return path

    def can_place_tower(self, grid_x, grid_y):
        if grid_x < 0 or grid_x >= GRID_WIDTH or grid_y < 0 or grid_y >= GRID_HEIGHT:
            return False

        if (grid_x, grid_y) in self.path_set:
            return False

        for post in self.posts:
            if post.grid_x == grid_x and post.grid_y == grid_y:
                return False

        hero_grid = (self.hero.grid_x, self.hero.grid_y)
        if (grid_x, grid_y) == hero_grid:
            return False

        return True

    def pick_enemy_type(self, wave_number: int, index: int) -> EnemyType:
        if wave_number <= 2:
            return EnemyType.MILITIA if index % 4 != 0 else EnemyType.RAIDER
        if wave_number <= 6:
            if index % 6 == 0:
                return EnemyType.BRUTE
            return EnemyType.RAIDER if index % 2 == 0 else EnemyType.MILITIA
        if index % 4 == 0:
            return EnemyType.BRUTE
        return EnemyType.RAIDER

    def spawn_wave(self):
        self.wave_number += 1
        enemies_count = 5 + self.wave_number

        for i in range(enemies_count):
            enemy_type = self.pick_enemy_type(self.wave_number, i)
            enemy = Enemy(self.path, self.wave_number, enemy_type, spawn_delay=i * 0.45)
            self.enemies.append(enemy)

        self.state = GameState.PLAYING

    def hero_basic_attack(self, now: float):
        if now - self.hero.last_attack_time < self.hero.attack_cooldown:
            return

        target = None
        target_dist = float("inf")
        for enemy in self.enemies:
            if not enemy.alive or enemy.reached_end or enemy.spawn_delay > 0:
                continue
            dist = math.hypot(enemy.x - self.hero.x, enemy.y - self.hero.y)
            if dist <= self.hero.attack_range and dist < target_dist:
                target = enemy
                target_dist = dist

        if target:
            target.take_damage(self.hero.attack_damage)
            self.hero.last_attack_time = now
            if not target.alive:
                self.gold += target.reward
                self.army_xp += 1

    def hero_slash(self, now: float):
        if now - self.hero.last_slash_time < self.hero.slash_cooldown:
            return

        nearby = [
            e
            for e in self.enemies
            if e.alive
            and not e.reached_end
            and e.spawn_delay <= 0
            and math.hypot(e.x - self.hero.x, e.y - self.hero.y) <= self.hero.slash_range
        ]

        if len(nearby) < 2:
            return

        for enemy in nearby:
            enemy.take_damage(self.hero.slash_damage)
            if not enemy.alive:
                self.gold += enemy.reward
                self.army_xp += 1
        self.hero.last_slash_time = now

    def hero_rally(self, now: float):
        if now - self.hero.last_rally_time < self.hero.rally_cooldown:
            return

        active_enemies = any(e.alive and not e.reached_end and e.spawn_delay <= 0 for e in self.enemies)
        if not active_enemies:
            return

        self.hero.last_rally_time = now
        self.hero.rally_until = now + self.hero.rally_duration

    def hero_escape(self, now: float):
        if now - self.hero.last_escape_time < self.hero.escape_cooldown:
            return

        imminent = any(
            e.alive and not e.reached_end and e.spawn_delay <= 0 and e.path_index >= len(self.path) - 4
            for e in self.enemies
        )
        if not imminent:
            return

        self.hero.last_escape_time = now
        self.hero.escape_charges = 1

    def update_game(self, dt: float):
        current_time = pygame.time.get_ticks() / 1000.0

        self.hero_slash(current_time)
        self.hero_rally(current_time)
        self.hero_escape(current_time)
        self.hero_basic_attack(current_time)

        for enemy in self.enemies[:]:
            if enemy.alive and not enemy.reached_end:
                enemy.update(dt)

                if enemy.reached_end:
                    if self.hero.escape_charges > 0:
                        self.hero.escape_charges -= 1
                        enemy.reached_end = False
                        enemy.retreat(tiles_back=8)
                    else:
                        self.lives -= 1
                        if self.lives <= 0:
                            self.state = GameState.GAME_OVER

        rally_active = current_time <= self.hero.rally_until
        damage_multiplier = self.hero.rally_multiplier if rally_active else 1.0

        for post in self.posts:
            target = post.find_target(self.enemies)
            if target:
                projectile = post.shoot(target, current_time, damage_multiplier)
                if projectile:
                    self.projectiles.append(projectile)

        for projectile in self.projectiles[:]:
            if not projectile.active:
                self.projectiles.remove(projectile)
                continue

            projectile.update()

            for enemy in self.enemies:
                if not enemy.alive or enemy.spawn_delay > 0:
                    continue

                dist = math.sqrt((enemy.x - projectile.x) ** 2 + (enemy.y - projectile.y) ** 2)
                if dist < enemy.radius + 2:
                    enemy.take_damage(projectile.damage)
                    projectile.active = False

                    if not enemy.alive:
                        self.gold += enemy.reward
                        self.army_xp += 1
                    break

        if self.state == GameState.PLAYING:
            all_done = all(not e.alive or e.reached_end for e in self.enemies)
            if all_done and len(self.enemies) > 0:
                self.enemies.clear()
                self.projectiles.clear()

                if self.wave_number >= self.max_waves:
                    self.state = GameState.VICTORY
                else:
                    self.state = GameState.BETWEEN_WAVES

    def draw_grid(self):
        for x in range(GRID_WIDTH):
            for y in range(GRID_HEIGHT):
                rect = pygame.Rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                pygame.draw.rect(self.screen, LIGHT_GRAY, rect, 1)

        for x, y in self.path:
            rect = pygame.Rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            pygame.draw.rect(self.screen, DARK_GRAY, rect)

        if self.selected_tower_type and self.hover_pos:
            grid_x, grid_y = self.hover_pos
            if self.can_place_tower(grid_x, grid_y):
                rect = pygame.Rect(grid_x * TILE_SIZE, grid_y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                stats = TOWER_TYPES[self.selected_tower_type]
                color = DARK_GREEN if self.gold >= stats.cost else RED

                surface = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                pygame.draw.rect(surface, (*color, 100), (0, 0, TILE_SIZE, TILE_SIZE))
                self.screen.blit(surface, (grid_x * TILE_SIZE, grid_y * TILE_SIZE))

        pygame.draw.circle(self.screen, YELLOW, (int(self.hero.x), int(self.hero.y)), 10)
        pygame.draw.circle(self.screen, BLACK, (int(self.hero.x), int(self.hero.y)), 10, 2)

    def draw_ui(self):
        ui_x = GRID_WIDTH * TILE_SIZE + 10
        ui_y = 10

        pygame.draw.rect(
            self.screen,
            LIGHT_GRAY,
            (GRID_WIDTH * TILE_SIZE, 0, SCREEN_WIDTH - GRID_WIDTH * TILE_SIZE, SCREEN_HEIGHT),
        )

        gold_text = self.font.render(f"Gold: {self.gold}", True, YELLOW)
        self.screen.blit(gold_text, (ui_x, ui_y))
        ui_y += 35

        lives_text = self.font.render(f"Lives: {self.lives}", True, RED)
        self.screen.blit(lives_text, (ui_x, ui_y))
        ui_y += 35

        xp_text = self.small_font.render(f"Army XP: {self.army_xp}", True, BLACK)
        self.screen.blit(xp_text, (ui_x, ui_y))
        ui_y += 32

        wave_text = self.font.render(f"Wave: {self.wave_number}/{self.max_waves}", True, BLACK)
        self.screen.blit(wave_text, (ui_x, ui_y))
        ui_y += 46

        slash_cd, rally_cd, escape_cd = self.hero.get_status(pygame.time.get_ticks() / 1000.0)
        rally_state = "UP" if pygame.time.get_ticks() / 1000.0 <= self.hero.rally_until else "-"
        escape_state = "READY" if self.hero.escape_charges > 0 else "-"

        hero_title = self.small_font.render("Hero: Commander", True, BLACK)
        self.screen.blit(hero_title, (ui_x, ui_y))
        ui_y += 24
        self.screen.blit(self.small_font.render(f"Slash CD: {slash_cd:.1f}s", True, BLACK), (ui_x, ui_y))
        ui_y += 20
        self.screen.blit(self.small_font.render(f"Rally CD: {rally_cd:.1f}s ({rally_state})", True, BLACK), (ui_x, ui_y))
        ui_y += 20
        self.screen.blit(self.small_font.render(f"Escape CD: {escape_cd:.1f}s ({escape_state})", True, BLACK), (ui_x, ui_y))
        ui_y += 34

        title_text = self.small_font.render("Deploy Army Posts:", True, BLACK)
        self.screen.blit(title_text, (ui_x, ui_y))
        ui_y += 28

        for tower_type in TowerType:
            stats = TOWER_TYPES[tower_type]
            button_rect = pygame.Rect(ui_x, ui_y, 210, 84)

            if self.selected_tower_type == tower_type:
                pygame.draw.rect(self.screen, YELLOW, button_rect)
                pygame.draw.rect(self.screen, BLACK, button_rect, 3)
            else:
                pygame.draw.rect(self.screen, WHITE, button_rect)
                pygame.draw.rect(self.screen, BLACK, button_rect, 2)

            name_text = self.small_font.render(stats.name, True, BLACK)
            cost_text = self.small_font.render(f"Cost: {stats.cost}", True, BLACK)
            dps_text = self.small_font.render(
                f"Dmg:{stats.damage} Rate:{stats.fire_rate:.1f}/s", True, BLACK
            )

            pygame.draw.circle(self.screen, stats.color, (ui_x + 15, ui_y + 42), 10)
            self.screen.blit(name_text, (ui_x + 35, ui_y + 6))
            self.screen.blit(cost_text, (ui_x + 35, ui_y + 30))
            self.screen.blit(dps_text, (ui_x + 35, ui_y + 52))

            self.tower_buttons[tower_type] = button_rect
            ui_y += 92

        if self.state == GameState.BETWEEN_WAVES:
            button_rect = pygame.Rect(ui_x, ui_y + 14, 210, 50)
            pygame.draw.rect(self.screen, GREEN, button_rect)
            pygame.draw.rect(self.screen, BLACK, button_rect, 2)

            button_text = self.font.render("START WAVE", True, BLACK)
            text_rect = button_text.get_rect(center=button_rect.center)
            self.screen.blit(button_text, text_rect)

            self.start_wave_button = button_rect

    def draw_game_over(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 180), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        self.screen.blit(overlay, (0, 0))

        title_text = self.font.render("GAME OVER!", True, RED)
        title_rect = title_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50))
        self.screen.blit(title_text, title_rect)

        wave_text = self.small_font.render(f"Reached Wave: {self.wave_number}", True, WHITE)
        wave_rect = wave_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        self.screen.blit(wave_text, wave_rect)

        restart_text = self.small_font.render("Press R to restart or Q to quit", True, WHITE)
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
        self.screen.blit(restart_text, restart_rect)

    def draw_victory(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 180), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        self.screen.blit(overlay, (0, 0))

        title_text = self.font.render("VICTORY!", True, YELLOW)
        title_rect = title_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 65))
        self.screen.blit(title_text, title_rect)

        lives_text = self.small_font.render(f"Lives Remaining: {self.lives}", True, WHITE)
        lives_rect = lives_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 20))
        self.screen.blit(lives_text, lives_rect)

        xp_text = self.small_font.render(f"Army XP Earned: {self.army_xp}", True, WHITE)
        xp_rect = xp_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 10))
        self.screen.blit(xp_text, xp_rect)

        restart_text = self.small_font.render("Press R to restart or Q to quit", True, WHITE)
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 55))
        self.screen.blit(restart_text, restart_rect)

    def handle_click(self, pos):
        mouse_x, mouse_y = pos

        for tower_type, button_rect in self.tower_buttons.items():
            if button_rect.collidepoint(pos):
                self.selected_tower_type = tower_type
                return

        if self.state == GameState.BETWEEN_WAVES and self.start_wave_button:
            if self.start_wave_button.collidepoint(pos):
                self.spawn_wave()
                return

        if self.selected_tower_type and mouse_x < GRID_WIDTH * TILE_SIZE:
            grid_x = mouse_x // TILE_SIZE
            grid_y = mouse_y // TILE_SIZE

            if self.can_place_tower(grid_x, grid_y):
                stats = TOWER_TYPES[self.selected_tower_type]
                if self.gold >= stats.cost:
                    post = ArmyPost(grid_x, grid_y, self.selected_tower_type)
                    self.posts.append(post)
                    self.gold -= stats.cost

    def handle_mouse_motion(self, pos):
        mouse_x, mouse_y = pos

        if mouse_x < GRID_WIDTH * TILE_SIZE:
            grid_x = mouse_x // TILE_SIZE
            grid_y = mouse_y // TILE_SIZE
            self.hover_pos = (grid_x, grid_y)
        else:
            self.hover_pos = None

    def reset_game(self):
        self.state = GameState.BETWEEN_WAVES
        self.gold = STARTING_GOLD
        self.lives = STARTING_LIVES
        self.wave_number = 0
        self.army_xp = 0
        self.posts.clear()
        self.enemies.clear()
        self.projectiles.clear()
        self.selected_tower_type = None
        self.hero = Hero(self.path)

    def run(self):
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:
                        self.handle_click(event.pos)
                elif event.type == pygame.MOUSEMOTION:
                    self.handle_mouse_motion(event.pos)
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_q:
                        self.running = False
                    elif event.key == pygame.K_r:
                        if self.state in [GameState.GAME_OVER, GameState.VICTORY]:
                            self.reset_game()

            if self.state == GameState.PLAYING:
                self.update_game(dt)

            self.screen.fill(WHITE)
            self.draw_grid()

            rally_active = pygame.time.get_ticks() / 1000.0 <= self.hero.rally_until
            for post in self.posts:
                post.draw(self.screen, rally_active)

            for enemy in self.enemies:
                enemy.draw(self.screen)

            for projectile in self.projectiles:
                projectile.draw(self.screen)

            self.draw_ui()

            if self.state == GameState.GAME_OVER:
                self.draw_game_over()
            elif self.state == GameState.VICTORY:
                self.draw_victory()

            pygame.display.flip()

        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()
