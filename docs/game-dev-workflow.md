# 🎮 Game Development Workflow - Step-by-Step Guide

This document provides a practical, step-by-step workflow for building your War Conquest game using AI agents, even if you've never coded before.

---

## 🗺️ The Big Picture

Building a game is like building a house:

1. **Foundation** - Core systems that everything else relies on
2. **Framework** - Major features and mechanics  
3. **Rooms** - Individual features and content
4. **Finishing touches** - Polish, effects, and refinement

You'll build your game in phases, testing constantly, and always keeping it playable.

---

## Phase 1: Getting Started (Week 1)

### Day 1-2: Planning & Setup

**Your tasks:**
- ✅ Read through your `game-design.md` document
- ✅ Read the beginner guides in the docs folder
- ✅ Understand Git basics
- ✅ Set up your development environment

**With AI Agent:**
```
Request: "Help me set up a basic game project structure for a 2D strategy game. 
I want to use [choose: Unity, Godot, JavaScript/HTML5, or another engine]. 
Guide me through installation and create a simple 'Hello World' game window."
```

**Success criteria:** You can run a program that shows a game window.

---

### Day 3-5: Your First Interactive Element

**Your goal:** Get ONE thing working that you can interact with.

**Example request to AI:**
```
"Create a simple test scene where:
- A square represents a tower
- A circle represents an enemy
- The enemy moves from left to right
- When they touch, the enemy disappears
- I can see this happen when I run the game

This is just a prototype to learn the basics. Don't worry about it looking good yet."
```

**Success criteria:**
- You can run the game
- You see something move
- You understand the basic game loop
- You're excited because something you imagined is now on screen!

---

### Day 6-7: Learn to Test & Iterate

**Practice the iteration cycle:**

1. **Run** the game
2. **Test** the feature  
3. **Identify** what needs improvement
4. **Describe** changes to AI agent
5. **Repeat**

**Example iteration:**
```
First request: "Make the enemy move across the screen"
Test: "Good! But it's too fast."
Second request: "Reduce enemy speed to half"
Test: "Perfect! Now can we add a second enemy?"
Third request: "Add another enemy that spawns 2 seconds after the first"
```

**Success criteria:** You're comfortable with the request → test → feedback cycle.

---

## Phase 2: Building Your MVP (Weeks 2-6)

Your MVP (Minimum Viable Product) from game-design.md:
- 1 level
- 1 tower type
- 2 unit types  
- 1 boss
- Basic mechanics only

### Week 2: Core Game Loop

**Goal:** Get the basic game flow working

**Features to build:**
1. Game starts on a play button
2. Transitions to game screen
3. Game has a simple win condition
4. Game has a simple lose condition
5. Can restart after win/lose

**Example request:**
```
"Set up a basic game flow:
- Start screen with 'Play' button
- Game screen (can be blank for now)
- Automatically go to 'You Win!' screen after 10 seconds
- Automatically go to 'Game Over' screen if I press spacebar
- Both end screens have a 'Try Again' button that goes back to start

This is just the skeleton - we'll add real gameplay next."
```

---

### Week 3: Tower Defense Phase (Part 1)

**Goal:** Place and see towers

**Features to build:**
1. Grid/tile system for tower placement
2. Basic tower placement mechanic
3. Visual representation of towers
4. Gold system (start with 200 gold)
5. Tower costs gold to place

**Breaking it down into requests:**

**Request 1:**
```
"Create a grid of tiles on the left side of the screen, 10 tiles wide by 8 tiles tall. 
Each tile should be clearly visible (use different colored borders or shading). 
This is where towers will be placed."
```

**Request 2:**
```
"Add tower placement:
- When I click an empty tile, place a tower there (use a simple square/circle placeholder)
- Show a gold counter at the top: starts at 200
- Each tower costs 50 gold
- Subtract gold when tower is placed
- Don't allow placement if gold < 50
- Don't allow placement if tile already has a tower"
```

**Test checklist:**
- ✅ Can place tower on empty tile
- ✅ Gold decreases correctly
- ✅ Can't place tower without enough gold
- ✅ Can't place tower on occupied tile
- ✅ Can see gold counter

---

### Week 4: Tower Defense Phase (Part 2)

**Goal:** Add enemies and combat

**Features to build:**
1. Enemy spawning
2. Enemy movement along path
3. Tower detection of enemies
4. Tower shooting at enemies
5. Damage and enemy death

**Request 1:**
```
"Add basic enemies:
- Create a simple enemy sprite (circle is fine)
- Enemy starts at the left side of the screen
- Enemy moves slowly to the right side
- Enemy has 30 health points
- When enemy reaches right side, it disappears (we'll add castle damage later)"
```

**Request 2:**
```
"Add a spawn button:
- Button labeled 'Spawn Enemy' at the top
- When clicked, create a new enemy
- For now, I want to manually spawn enemies for testing
- Later we'll make them spawn automatically"
```

**Request 3:**
```
"Make towers shoot at enemies:
- Tower detects enemies within 150 pixels
- Tower shoots an arrow projectile at nearest enemy
- Arrow travels from tower to enemy
- Arrow does 10 damage when it hits
- Enemy disappears when health reaches 0
- Tower shoots once per second
- Show enemy health bar above enemy"
```

**Test checklist:**
- ✅ Enemies spawn and move
- ✅ Towers detect enemies in range
- ✅ Towers shoot arrows
- ✅ Arrows hit enemies
- ✅ Enemies take damage
- ✅ Enemies die at 0 health

---

### Week 5: Win/Lose Conditions

**Goal:** Make it an actual game with objectives

**Features to build:**
1. Player castle health
2. Enemies damage castle
3. Win condition (survive waves)
4. Lose condition (castle destroyed)

**Request:**
```
"Add castle defense mechanics:

CASTLE HEALTH:
- Player's castle is on the right side
- Castle starts with 100 health
- Show castle health bar at top right

ENEMY BEHAVIOR:
- When enemy reaches castle, it deals 10 damage
- Enemy disappears after attacking
- If castle health reaches 0, game over

WAVE SYSTEM:
- Start with 5 enemies spawning automatically
- Each enemy spawns 3 seconds after the previous
- After all 5 enemies are defeated or reach castle, show 'You Win!'

WIN/LOSE SCREENS:
- Game over if castle reaches 0 health
- Victory if all 5 enemies defeated and castle still alive
- Show appropriate message screen"
```

**Test checklist:**
- ✅ Castle has health
- ✅ Enemies damage castle
- ✅ Game ends on castle death
- ✅ Waves spawn automatically
- ✅ Can win by defending successfully

---

### Week 6: Polish the MVP

**Goal:** Make it feel like a real game

**Request:**
```
"Let's add polish to make the tower defense phase feel complete:

GAME START:
- Start with 200 gold
- Give player 10 seconds to place towers before enemies spawn
- Show a countdown timer

TOWER IMPROVEMENTS:
- Add a range indicator circle when placing tower (shows shooting range)
- Tower sprite rotates to face the enemy it's shooting at
- Add a simple particle effect when arrow hits enemy

FEEDBACK:
- Screen shakes slightly when castle takes damage
- Play a sound when tower shoots (can be a simple beep for now)
- Play a sound when enemy dies
- Flash enemy red when taking damage

UI POLISH:
- Clean up the UI layout
- Make buttons look nicer
- Add a pause button
- Add a wave counter (Wave 1/1 for now)

Make these changes one at a time so we can test each addition."
```

---

## Phase 3: Expanding the Game (Weeks 7-10)

Now that you have a working tower defense phase, you can:

### Option A: Add More Tower Defense Content
- Add a second tower type
- Add a second enemy type
- Add tower upgrades
- Add more waves

### Option B: Add Lane Battle Phase
- Implement the war/lane battle system from your design doc

### Option C: Add Boss Fight Phase  
- Implement the turn-based boss battle

**Choose based on what excites you most!**

---

## The Daily Workflow

### Every Development Session:

**1. Start (5 minutes)**
- Review what you did last time
- Check your to-do list / GitHub issues
- Pick ONE feature to work on today

**2. Request (10 minutes)**
- Write clear request to AI agent
- Reference your design document
- Be specific about what you want

**3. Implementation (AI does this)**
- AI agent writes code
- AI agent tests it
- AI agent commits changes

**4. Testing (15-30 minutes)**
- Run the game
- Test the new feature thoroughly
- Test that old features still work
- Note any issues or ideas

**5. Feedback (10 minutes)**
- Report bugs found
- Suggest improvements
- Request adjustments
- OR approve and move to next feature

**6. Documentation (5 minutes)**
- Update your notes
- Mark tasks as complete
- Plan next session's work

---

## Working with AI Agents: Practical Tips

### How to Structure Your Requests

**Template:**
```
"I want to add [FEATURE] that [DOES WHAT].

SPECIFICS:
- [Detail 1]
- [Detail 2]
- [Detail 3]

VISUAL:
- [How it should look]

BEHAVIOR:
- [How it should act]

Start with [specific first step] and we'll build on it."
```

### Example of Breaking Down a Big Feature

**Too big:**
> "Add a complete progression system with upgrades and unlocks"

**Broken down correctly:**
```
Session 1: "Add a simple upgrade button next to each placed tower that costs 100 gold"
Session 2: "When tower is upgraded, increase its damage from 10 to 15"
Session 3: "Change tower sprite to look different when upgraded"
Session 4: "Add a second upgrade tier that costs 150 gold and increases damage to 20"
```

---

## Testing Checklist

After each feature addition, test:

### Functionality
- ✅ Does the feature work as intended?
- ✅ Can you break it by doing something weird?
- ✅ Do all the numbers feel right?

### Integration
- ✅ Do old features still work?
- ✅ Does this work well with other systems?
- ✅ Any unexpected interactions?

### Feel
- ✅ Is it fun?
- ✅ Is it clear what's happening?
- ✅ Does it match your vision?

### Performance
- ✅ Does the game run smoothly?
- ✅ Any lag or stuttering?
- ✅ Any crashes?

---

## Managing Your Project

### Using GitHub Issues

**Create issues for:**
- Features to add
- Bugs to fix
- Ideas to explore later
- Questions to research

**Example issues:**
```
Title: "Add second enemy type"
Description: "Need a fast enemy that has less health but moves 2x speed. 
Should cost same gold to spawn but give 25% less gold on kill."

Title: "Bug: Towers can shoot through walls"
Description: "Towers are detecting enemies through obstacles. 
They should only shoot if there's a clear line of sight."

Title: "Idea: Add tower targeting priorities"
Description: "Let player choose if tower targets: nearest, weakest, or strongest enemy."
```

### Using Branches

**Branch strategy:**
```
main - Always working version
feature/tower-upgrades - Testing upgrade system
feature/new-enemies - Adding enemy variety
bugfix/tower-targeting - Fixing targeting bug
```

**Workflow:**
1. Create branch for feature
2. AI agent makes changes on branch
3. Test thoroughly
4. Merge to main when working
5. Delete feature branch

---

## When Things Go Wrong

### "The feature doesn't work at all"
**What to do:**
1. Describe exactly what happens vs. what should happen
2. Ask AI agent to debug
3. Agent will review code and fix issues
4. Test again

### "It works but feels wrong"
**What to do:**
1. Describe how it feels wrong (too fast, too weak, not fun, etc.)
2. Suggest specific changes to test
3. Iterate until it feels right
4. Remember: game design is about iteration!

### "I broke something that was working"
**What to do:**
1. Check Git history to see what changed
2. If needed, revert to previous commit
3. Start over with smaller changes
4. Test after each small change

### "I'm stuck and don't know what to do next"
**What to do:**
1. Review your game design document
2. Look at your MVP checklist
3. Pick the simplest unfinished item
4. Or, just play your game and note what feels missing!

---

## Milestone Celebrations! 🎉

Celebrate these achievements:

- ✨ **First Playable:** You can place a tower and kill an enemy
- ✨ **First Win:** You can complete a level successfully
- ✨ **First Loss:** The game can beat you!
- ✨ **MVP Complete:** All core mechanics working
- ✨ **First Playtester:** Someone else plays your game
- ✨ **Version 1.0:** Your game is feature-complete

Take screenshots, save your game at these milestones, and be proud of your progress!

---

## Balancing Your Game

### The Balancing Loop

1. **Play** the game yourself
2. **Note** what feels too easy/hard/boring/frustrating
3. **Adjust** numbers (damage, health, cost, speed)
4. **Test** again
5. **Repeat**

### Key Questions to Ask

**Is it too easy?**
- Increase enemy health
- Decrease tower damage
- Increase enemy speed
- Decrease gold income

**Is it too hard?**
- Decrease enemy health
- Increase tower damage
- Decrease enemy speed  
- Increase gold income

**Is it boring?**
- Increase game speed overall
- Add variety (new enemies/towers)
- Add interesting decisions (upgrade choices)
- Add risk/reward mechanics

---

## Long-Term Planning

### Your Roadmap

**Months 1-2: MVP**
- Core tower defense working
- Basic win/lose
- 1 level playable

**Months 3-4: Content**
- Multiple tower types
- Multiple enemy types
- Multiple levels
- Basic progression

**Months 5-6: Additional Phases**
- Lane battle system
- Boss fight system
- Campaign structure

**Months 7+: Polish & Expansion**
- Graphics and effects
- Sound and music
- More content
- Balancing and playtesting

---

## Resources You've Created

As you work, you'll build up:

- **game-design.md** - Your vision and plans
- **GitHub Issues** - Your to-do list
- **Commit History** - Your progress log
- **Playable Builds** - Your game at different stages
- **Notes/Journal** - Your thoughts and learnings

These are all valuable! They show your progress and help you learn.

---

## Remember

**Development is not linear**
- Some days you'll make huge progress
- Some days you'll struggle with one small thing
- Both are normal and part of the process!

**Perfect is the enemy of done**
- Get it working first
- Make it good second
- Make it perfect last (if ever!)

**Your game will evolve**
- Your initial design will change
- You'll discover new ideas while building
- That's good! Embrace it!

**The journey is the reward**
- Learning to work with AI is a valuable skill
- Building something from nothing is amazing
- Every small victory counts!

---

## Next Steps

1. **Today:** Read through this workflow
2. **Tomorrow:** Start Phase 1, Day 1
3. **This Week:** Get your first interactive element working
4. **This Month:** Complete your MVP tower defense phase
5. **Beyond:** Keep building, testing, and improving!

You've got this! 🚀🎮

---

## Need Help?

When you're stuck:
1. Reference the **technical-glossary.md** for terms
2. Review **git-basics-for-beginners.md** for version control
3. Check **working-with-ai-agents.md** for communication tips
4. Ask the AI agent for help - that's what they're here for!
5. Break the problem down into smaller pieces
6. Take a break and come back with fresh eyes

Remember: Every game developer gets stuck. The difference is that you have AI agents to help you through it! 💪
