#!/usr/bin/env python3
"""
War Conquest - Tower Defense Phase
Army-post based defense with hero chase combat.
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
SELL_RATIO = 0.7


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
    TowerType.SOLDIER_BARRACKS: TowerStats("Soldier Barracks", 140, 22, 0.65, 4, BLUE, CYAN),
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

        dx = target_x - x
        dy = target_y - y
        dist = math.hypot(dx, dy)
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

        if math.hypot(self.x - self.target_x, self.y - self.target_y) < 5:
            self.active = False

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), 4)


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
        dist = math.hypot(dx, dy)

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
        bar_x = self.x - bar_width // 2
        bar_y = self.y - self.radius - 10

        pygame.draw.rect(screen, BLACK, (bar_x, bar_y, bar_width, 4))
        health_width = int((self.health / self.max_health) * bar_width)
        if health_width > 0:
            pygame.draw.rect(screen, GREEN, (bar_x, bar_y, health_width, 4))


class ArmyPost:
    def __init__(self, grid_x, grid_y, tower_type: TowerType):
        self.grid_x = grid_x
        self.grid_y = grid_y
        self.tower_type = tower_type
        self.stats = TOWER_TYPES[tower_type]
        self.last_shot_time = 0.0
        self.last_spawn_time = 0.0

    def get_screen_pos(self):
        return (
            self.grid_x * TILE_SIZE + TILE_SIZE // 2,
            self.grid_y * TILE_SIZE + TILE_SIZE // 2,
        )

    def can_shoot(self, current_time: float):
        cooldown = 1.0 / self.stats.fire_rate
        return current_time - self.last_shot_time >= cooldown

    def can_spawn(self, current_time: float):
        cooldown = 1.0 / self.stats.fire_rate
        return current_time - self.last_spawn_time >= cooldown

    def find_target(self, enemies):
        x, y = self.get_screen_pos()
        range_pixels = self.stats.range * TILE_SIZE

        closest_enemy = None
        closest_dist = float("inf")

        for enemy in enemies:
            if not enemy.alive or enemy.reached_end or enemy.spawn_delay > 0:
                continue

            dist = math.hypot(enemy.x - x, enemy.y - y)
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
        return Projectile(x, y, target.x, target.y, damage, self.stats.projectile_color, speed=6)

    def draw(self, screen, rally_active=False):
        x, y = self.get_screen_pos()

        range_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.circle(range_surface, (*self.stats.color, 30), (x, y), self.stats.range * TILE_SIZE)
        screen.blit(range_surface, (0, 0))

        pygame.draw.rect(
            screen,
            self.stats.color,
            (self.grid_x * TILE_SIZE + 5, self.grid_y * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10),
        )
        pygame.draw.rect(
            screen,
            BLACK,
            (self.grid_x * TILE_SIZE + 5, self.grid_y * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10),
            2,
        )

        if rally_active:
            pygame.draw.circle(screen, YELLOW, (int(x), int(y)), 4)


class SoldierUnit:
    def __init__(self, home_x: float, home_y: float, owner_post: ArmyPost):
        self.home_x = home_x
        self.home_y = home_y
        self.x = home_x
        self.y = home_y
        self.owner_post = owner_post

        self.speed = 2.6
        self.attack_range = 20
        self.leash_range = owner_post.stats.range * TILE_SIZE
        self.attack_damage = owner_post.stats.damage
        self.attack_cooldown = 0.9
        self.last_attack_time = 0.0
        self.attack_anim_time = 0.0
        self.attack_dx = 1.0
        self.attack_dy = 0.0
        self.active = True

    def find_target(self, enemies):
        closest = None
        closest_dist = float("inf")

        for enemy in enemies:
            if not enemy.alive or enemy.reached_end or enemy.spawn_delay > 0:
                continue
            dist_home = math.hypot(enemy.x - self.home_x, enemy.y - self.home_y)
            if dist_home > self.leash_range:
                continue

            dist_self = math.hypot(enemy.x - self.x, enemy.y - self.y)
            if dist_self < closest_dist:
                closest = enemy
                closest_dist = dist_self

        return closest

    def update(self, dt: float, now: float, enemies, damage_multiplier=1.0):
        if not self.active:
            return []

        rewards = []
        if self.attack_anim_time > 0:
            self.attack_anim_time = max(0.0, self.attack_anim_time - dt)

        target = self.find_target(enemies)
        if target:
            dx = target.x - self.x
            dy = target.y - self.y
            dist = math.hypot(dx, dy)
            step = self.speed * dt * 60

            if dist > self.attack_range and dist > 0:
                self.x += (dx / dist) * step
                self.y += (dy / dist) * step
            elif now - self.last_attack_time >= self.attack_cooldown:
                target.take_damage(int(self.attack_damage * damage_multiplier))
                self.last_attack_time = now
                self.attack_anim_time = 0.15
                if dist > 0:
                    self.attack_dx = dx / dist
                    self.attack_dy = dy / dist
                if not target.alive:
                    rewards.append(target)
        else:
            dx = self.home_x - self.x
            dy = self.home_y - self.y
            dist = math.hypot(dx, dy)
            step = self.speed * dt * 60
            if dist > 2 and dist > 0:
                self.x += (dx / dist) * step
                self.y += (dy / dist) * step

        return rewards

    def draw(self, screen):
        if not self.active:
            return

        pygame.draw.circle(screen, CYAN, (int(self.x), int(self.y)), 8)
        pygame.draw.circle(screen, BLACK, (int(self.x), int(self.y)), 8, 2)

        if self.attack_anim_time > 0:
            tip_x = self.x + self.attack_dx * 14
            tip_y = self.y + self.attack_dy * 14
            pygame.draw.line(screen, YELLOW, (int(self.x), int(self.y)), (int(tip_x), int(tip_y)), 3)


class Hero:
    def __init__(self, path):
        mid_idx = len(path) // 2
        self.anchor_grid = path[mid_idx]
        self.anchor_x = self.anchor_grid[0] * TILE_SIZE + TILE_SIZE // 2
        self.anchor_y = self.anchor_grid[1] * TILE_SIZE + TILE_SIZE // 2

        self.x = float(self.anchor_x)
        self.y = float(self.anchor_y)
        self.move_speed = 3.0

        self.attack_damage = 22
        self.attack_range = 22
        self.attack_cooldown = 0.7
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

        self.attack_anim_time = 0.0
        self.attack_dx = 1.0
        self.attack_dy = 0.0

    @property
    def grid_x(self):
        return int(self.anchor_grid[0])

    @property
    def grid_y(self):
        return int(self.anchor_grid[1])

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

        self.debug_infinite_gold = False
        self.status_message = "Deploy Army Posts. Right-click to sell."

        self.path = self.create_path()
        self.posts: List[ArmyPost] = []
        self.soldiers: List[SoldierUnit] = []
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

        if (grid_x, grid_y) == (self.hero.grid_x, self.hero.grid_y):
            return False

        return True

    def get_post_at(self, grid_x: int, grid_y: int):
        for post in self.posts:
            if post.grid_x == grid_x and post.grid_y == grid_y:
                return post
        return None

    def add_kill_reward(self, enemy: Enemy):
        self.gold += enemy.reward
        self.army_xp += 1

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
        self.status_message = f"Wave {self.wave_number} started."

    def spend_gold(self, amount: int) -> bool:
        if self.debug_infinite_gold:
            return True
        if self.gold < amount:
            return False
        self.gold -= amount
        return True

    def hero_choose_target(self):
        closest = None
        closest_dist = float("inf")
        for enemy in self.enemies:
            if not enemy.alive or enemy.reached_end or enemy.spawn_delay > 0:
                continue
            dist = math.hypot(enemy.x - self.hero.x, enemy.y - self.hero.y)
            if dist < closest_dist:
                closest = enemy
                closest_dist = dist
        return closest, closest_dist

    def hero_basic_attack(self, now: float):
        if now - self.hero.last_attack_time < self.hero.attack_cooldown:
            return

        target, distance = self.hero_choose_target()
        if target is None or distance > self.hero.attack_range:
            return

        target.take_damage(self.hero.attack_damage)
        self.hero.last_attack_time = now
        self.hero.attack_anim_time = 0.14

        if distance > 0:
            self.hero.attack_dx = (target.x - self.hero.x) / distance
            self.hero.attack_dy = (target.y - self.hero.y) / distance

        if not target.alive:
            self.add_kill_reward(target)

    def hero_move(self, dt: float):
        target, distance = self.hero_choose_target()
        step = self.hero.move_speed * dt * 60

        if target and distance > self.hero.attack_range * 0.85:
            dx = target.x - self.hero.x
            dy = target.y - self.hero.y
            if distance > 0:
                self.hero.x += (dx / distance) * step
                self.hero.y += (dy / distance) * step
        elif target is None:
            dx = self.hero.anchor_x - self.hero.x
            dy = self.hero.anchor_y - self.hero.y
            dist_home = math.hypot(dx, dy)
            if dist_home > 2 and dist_home > 0:
                self.hero.x += (dx / dist_home) * step
                self.hero.y += (dy / dist_home) * step

    def hero_slash(self, now: float):
        if now - self.hero.last_slash_time < self.hero.slash_cooldown:
            return

        nearby = [
            enemy
            for enemy in self.enemies
            if enemy.alive
            and not enemy.reached_end
            and enemy.spawn_delay <= 0
            and math.hypot(enemy.x - self.hero.x, enemy.y - self.hero.y) <= self.hero.slash_range
        ]

        if len(nearby) < 2:
            return

        for enemy in nearby:
            enemy.take_damage(self.hero.slash_damage)
            if not enemy.alive:
                self.add_kill_reward(enemy)

        self.hero.last_slash_time = now
        self.hero.attack_anim_time = 0.2

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

    def update_soldier_barracks(self, dt: float, now: float, damage_multiplier: float):
        current_barracks = [post for post in self.posts if post.tower_type == TowerType.SOLDIER_BARRACKS]

        self.soldiers = [
            soldier for soldier in self.soldiers if soldier.owner_post in current_barracks and soldier.active
        ]

        for barracks in current_barracks:
            has_soldier = any(s.owner_post == barracks for s in self.soldiers)
            if not has_soldier and barracks.can_spawn(now):
                barracks.last_spawn_time = now
                x, y = barracks.get_screen_pos()
                self.soldiers.append(SoldierUnit(x, y, barracks))

        for soldier in self.soldiers:
            rewards = soldier.update(dt, now, self.enemies, damage_multiplier)
            for enemy in rewards:
                self.add_kill_reward(enemy)

    def update_game(self, dt: float):
        current_time = pygame.time.get_ticks() / 1000.0

        if self.hero.attack_anim_time > 0:
            self.hero.attack_anim_time = max(0.0, self.hero.attack_anim_time - dt)

        self.hero_move(dt)
        self.hero_slash(current_time)
        self.hero_rally(current_time)
        self.hero_escape(current_time)
        self.hero_basic_attack(current_time)

        for enemy in self.enemies:
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
            if post.tower_type != TowerType.ARCHER_POST:
                continue
            target = post.find_target(self.enemies)
            if target:
                projectile = post.shoot(target, current_time, damage_multiplier)
                if projectile:
                    self.projectiles.append(projectile)

        self.update_soldier_barracks(dt, current_time, damage_multiplier)

        for projectile in self.projectiles[:]:
            if not projectile.active:
                self.projectiles.remove(projectile)
                continue

            projectile.update()

            for enemy in self.enemies:
                if not enemy.alive or enemy.spawn_delay > 0:
                    continue
                if math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < enemy.radius + 2:
                    enemy.take_damage(projectile.damage)
                    projectile.active = False
                    if not enemy.alive:
                        self.add_kill_reward(enemy)
                    break

        if self.state == GameState.PLAYING:
            all_done = all(not enemy.alive or enemy.reached_end for enemy in self.enemies)
            if all_done and len(self.enemies) > 0:
                self.enemies.clear()
                self.projectiles.clear()
                self.hero.escape_charges = 0

                if self.wave_number >= self.max_waves:
                    self.state = GameState.VICTORY
                else:
                    self.state = GameState.BETWEEN_WAVES
                    self.status_message = f"Wave {self.wave_number} complete."

    def draw_grid(self):
        for x in range(GRID_WIDTH):
            for y in range(GRID_HEIGHT):
                pygame.draw.rect(self.screen, LIGHT_GRAY, (x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE), 1)

        for x, y in self.path:
            pygame.draw.rect(self.screen, DARK_GRAY, (x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE))

        if self.selected_tower_type and self.hover_pos:
            grid_x, grid_y = self.hover_pos
            if self.can_place_tower(grid_x, grid_y):
                stats = TOWER_TYPES[self.selected_tower_type]
                affordable = self.debug_infinite_gold or self.gold >= stats.cost
                color = DARK_GREEN if affordable else RED
                surface = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                pygame.draw.rect(surface, (*color, 100), (0, 0, TILE_SIZE, TILE_SIZE))
                self.screen.blit(surface, (grid_x * TILE_SIZE, grid_y * TILE_SIZE))

        pygame.draw.circle(self.screen, YELLOW, (int(self.hero.x), int(self.hero.y)), 10)
        pygame.draw.circle(self.screen, BLACK, (int(self.hero.x), int(self.hero.y)), 10, 2)

        if self.hero.attack_anim_time > 0:
            tip_x = self.hero.x + self.hero.attack_dx * 18
            tip_y = self.hero.y + self.hero.attack_dy * 18
            pygame.draw.line(self.screen, ORANGE, (int(self.hero.x), int(self.hero.y)), (int(tip_x), int(tip_y)), 4)

    def draw_ui(self):
        ui_x = GRID_WIDTH * TILE_SIZE + 10
        ui_y = 10

        pygame.draw.rect(self.screen, LIGHT_GRAY, (GRID_WIDTH * TILE_SIZE, 0, SCREEN_WIDTH - GRID_WIDTH * TILE_SIZE, SCREEN_HEIGHT))

        gold_display = "INF" if self.debug_infinite_gold else str(self.gold)
        self.screen.blit(self.font.render(f"Gold: {gold_display}", True, YELLOW), (ui_x, ui_y))
        ui_y += 35
        self.screen.blit(self.font.render(f"Lives: {self.lives}", True, RED), (ui_x, ui_y))
        ui_y += 35
        self.screen.blit(self.small_font.render(f"Army XP: {self.army_xp}", True, BLACK), (ui_x, ui_y))
        ui_y += 32
        self.screen.blit(self.font.render(f"Wave: {self.wave_number}/{self.max_waves}", True, BLACK), (ui_x, ui_y))
        ui_y += 40

        debug_text = "ON" if self.debug_infinite_gold else "OFF"
        self.screen.blit(self.small_font.render(f"Debug Gold (D): {debug_text}", True, BLACK), (ui_x, ui_y))
        ui_y += 24

        slash_cd, rally_cd, escape_cd = self.hero.get_status(pygame.time.get_ticks() / 1000.0)
        rally_state = "UP" if pygame.time.get_ticks() / 1000.0 <= self.hero.rally_until else "-"
        escape_state = "READY" if self.hero.escape_charges > 0 else "-"

        self.screen.blit(self.small_font.render("Hero: Commander", True, BLACK), (ui_x, ui_y))
        ui_y += 22
        self.screen.blit(self.small_font.render(f"Slash CD: {slash_cd:.1f}s", True, BLACK), (ui_x, ui_y))
        ui_y += 19
        self.screen.blit(self.small_font.render(f"Rally CD: {rally_cd:.1f}s ({rally_state})", True, BLACK), (ui_x, ui_y))
        ui_y += 19
        self.screen.blit(self.small_font.render(f"Escape CD: {escape_cd:.1f}s ({escape_state})", True, BLACK), (ui_x, ui_y))
        ui_y += 28

        self.screen.blit(self.small_font.render("Deploy Army Posts:", True, BLACK), (ui_x, ui_y))
        ui_y += 24

        self.tower_buttons = {}
        for tower_type in TowerType:
            stats = TOWER_TYPES[tower_type]
            button_rect = pygame.Rect(ui_x, ui_y, 210, 80)

            if self.selected_tower_type == tower_type:
                pygame.draw.rect(self.screen, YELLOW, button_rect)
                pygame.draw.rect(self.screen, BLACK, button_rect, 3)
            else:
                pygame.draw.rect(self.screen, WHITE, button_rect)
                pygame.draw.rect(self.screen, BLACK, button_rect, 2)

            self.screen.blit(self.small_font.render(stats.name, True, BLACK), (ui_x + 34, ui_y + 6))
            self.screen.blit(self.small_font.render(f"Cost: {stats.cost}", True, BLACK), (ui_x + 34, ui_y + 29))
            self.screen.blit(self.small_font.render(f"Power: {stats.damage}", True, BLACK), (ui_x + 34, ui_y + 51))
            pygame.draw.circle(self.screen, stats.color, (ui_x + 14, ui_y + 38), 9)

            self.tower_buttons[tower_type] = button_rect
            ui_y += 88

        if self.state == GameState.BETWEEN_WAVES:
            self.start_wave_button = pygame.Rect(ui_x, ui_y + 10, 210, 48)
            pygame.draw.rect(self.screen, GREEN, self.start_wave_button)
            pygame.draw.rect(self.screen, BLACK, self.start_wave_button, 2)
            text = self.font.render("START WAVE", True, BLACK)
            self.screen.blit(text, text.get_rect(center=self.start_wave_button.center))
        else:
            self.start_wave_button = None

        msg = self.small_font.render(self.status_message[:38], True, BLACK)
        self.screen.blit(msg, (ui_x, SCREEN_HEIGHT - 28))

    def draw_game_over(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 180), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        self.screen.blit(overlay, (0, 0))
        self.screen.blit(self.font.render("GAME OVER!", True, RED), (SCREEN_WIDTH // 2 - 90, SCREEN_HEIGHT // 2 - 45))
        self.screen.blit(self.small_font.render("Press R to restart or Q to quit", True, WHITE), (SCREEN_WIDTH // 2 - 130, SCREEN_HEIGHT // 2 + 20))

    def draw_victory(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 180), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        self.screen.blit(overlay, (0, 0))
        self.screen.blit(self.font.render("VICTORY!", True, YELLOW), (SCREEN_WIDTH // 2 - 70, SCREEN_HEIGHT // 2 - 45))
        self.screen.blit(self.small_font.render(f"Army XP Earned: {self.army_xp}", True, WHITE), (SCREEN_WIDTH // 2 - 95, SCREEN_HEIGHT // 2 + 2))
        self.screen.blit(self.small_font.render("Press R to restart or Q to quit", True, WHITE), (SCREEN_WIDTH // 2 - 130, SCREEN_HEIGHT // 2 + 35))

    def sell_post_at(self, grid_x: int, grid_y: int):
        post = self.get_post_at(grid_x, grid_y)
        if not post:
            return

        self.posts.remove(post)
        self.soldiers = [s for s in self.soldiers if s.owner_post != post]

        refund = int(post.stats.cost * SELL_RATIO)
        if not self.debug_infinite_gold:
            self.gold += refund
        self.status_message = f"Sold {post.stats.name} for {refund}."

    def handle_click(self, pos):
        mouse_x, mouse_y = pos

        for tower_type, button_rect in self.tower_buttons.items():
            if button_rect.collidepoint(pos):
                self.selected_tower_type = tower_type
                self.status_message = f"Selected {TOWER_TYPES[tower_type].name}."
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
                if self.spend_gold(stats.cost):
                    self.posts.append(ArmyPost(grid_x, grid_y, self.selected_tower_type))
                    self.status_message = f"Deployed {stats.name}."
                else:
                    self.status_message = "Not enough gold."

    def handle_right_click(self, pos):
        mouse_x, mouse_y = pos
        if mouse_x >= GRID_WIDTH * TILE_SIZE:
            return
        self.sell_post_at(mouse_x // TILE_SIZE, mouse_y // TILE_SIZE)

    def handle_mouse_motion(self, pos):
        mouse_x, mouse_y = pos
        if mouse_x < GRID_WIDTH * TILE_SIZE:
            self.hover_pos = (mouse_x // TILE_SIZE, mouse_y // TILE_SIZE)
        else:
            self.hover_pos = None

    def reset_game(self):
        self.state = GameState.BETWEEN_WAVES
        self.gold = STARTING_GOLD
        self.lives = STARTING_LIVES
        self.wave_number = 0
        self.army_xp = 0
        self.posts.clear()
        self.soldiers.clear()
        self.enemies.clear()
        self.projectiles.clear()
        self.selected_tower_type = None
        self.debug_infinite_gold = False
        self.status_message = "Deploy Army Posts. Right-click to sell."
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
                    elif event.button == 3:
                        self.handle_right_click(event.pos)
                elif event.type == pygame.MOUSEMOTION:
                    self.handle_mouse_motion(event.pos)
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_q:
                        self.running = False
                    elif event.key == pygame.K_r and self.state in [GameState.GAME_OVER, GameState.VICTORY]:
                        self.reset_game()
                    elif event.key == pygame.K_d:
                        self.debug_infinite_gold = not self.debug_infinite_gold
                        self.status_message = f"Debug gold {'enabled' if self.debug_infinite_gold else 'disabled'}."

            if self.state == GameState.PLAYING:
                self.update_game(dt)

            self.screen.fill(WHITE)
            self.draw_grid()

            rally_active = pygame.time.get_ticks() / 1000.0 <= self.hero.rally_until
            for post in self.posts:
                post.draw(self.screen, rally_active)

            for soldier in self.soldiers:
                soldier.draw(self.screen)

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
    Game().run()
