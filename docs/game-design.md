# Game Design Document

# 1️⃣0️⃣ Hero System

**Core Concept**
- Player character that appears personally in all three stages
- Separate progression from Army with unique currency (Royal Gems)
- Hero abilities change or adapt based on game stage but are the same character
- Royal Gems earned only by winning/completing levels

**Hero Abilities (3 base abilities)**
- Ability 1: Slash (physical attack, varies in effect per stage)
- Ability 2: Rally (buffs army/defense based on stage)
- Ability 3: Escape (dodge/retreat mechanic)

**Hero Upgrade Tree**

**Path 1: Warrior (Physical Power)**
- Tier 1: Increased attack power (+10% damage)
- Tier 2: Cleaving Strikes (hit multiple enemies with attacks, 10 Royal Gems)
- Tier 3: Bloodlust (damage increases as health decreases, 20 Royal Gems)
- Tier 4: Crushing Blow (heavy attack that stuns enemies, 35 Royal Gems)
- Tier 5: Warlord's Presence (all nearby units deal +15% damage, 60 Royal Gems)

**Path 2: Guardian (Defense/Support)**
- Tier 1: Increased HP (+10% max health)
- Tier 2: Protective Stance (reduce damage taken by 15%, 10 Royal Gems)
- Tier 3: Shield Mastery (block/parry attacks, 20 Royal Gems)
- Tier 4: Fortify (create defensive barrier, 35 Royal Gems)
- Tier 5: Iron Will (immunity to status effects, 60 Royal Gems)

**Path 3: Mystic (Magic/Control)**
- Tier 1: Mana pool (enable special abilities, +20 mana)
- Tier 2: Force Push (knockback enemies, 10 Royal Gems)
- Tier 3: Arcane Mastery (increase ability power, 20 Royal Gems)
- Tier 4: Time Warp (slow enemy abilities, 35 Royal Gems)
- Tier 5: Reality Bend (control enemy unit positioning, 60 Royal Gems)

# 1️⃣1️⃣ Currencies

**Army Experience (Army XP)**
- Earned from: Defeating enemy units in any stage
- Amount: 1 XP per enemy defeated, bonus XP for quick kills (2x)
- Used for: Unit upgrades only
- Cap: No cap (accumulates)

**Royal Gems**
- Earned from: Winning a level (completing all 3 stages successfully)
- Amount: 5-15 gems per level based on difficulty/performance
- Used for: Hero ability upgrades only
- Cap: No cap (accumulates)

**Gold (Stage Resource)**
- Earned from: Defeating enemies during Tower Defense and Lane Battle phases
- Used for: Immediate tower/unit purchases in active phases
- Does NOT carry between levels (resets each level)
- Can optionally be converted to Army XP at a ratio (1 Gold = 0.5 Army XP) for grinding

# 1️⃣2️⃣ Unified Mechanics Across Stages

**Tower Defense Phase**
- Archer upgrade: Affects archer tower damage/fire rate/range
- Soldier upgrade: Affects soldier tower health/defense
- Hero: Present as defensive commander, abilities help with tower placement/buffs

**Lane Battle Phase**
- Archer upgrade: Affects spawned archer units' stats
- Soldier upgrade: Affects spawned soldier units' stats
- Hero: Active combatant, abilities used to support army or damage enemies directly

**Boss Duel Phase**
- Archer upgrade: Archers provide ranged support, triggering bonus abilities
- Soldier upgrade: Soldiers provide defensive support or tank damage
- Hero: Primary combatant, abilities used in turn-based combat system

**Progression Philosophy**
- Early upgrades feel impactful (Tier 1-2)
- Mid-game unlocks specialization options (choosing upgrade paths)
- Late-game upgrades create synergy between Army and Hero
- No "bad" upgrades - all choices should be viable
- Encourage multiple playstyles (pure army focus, hero focus, hybrid)