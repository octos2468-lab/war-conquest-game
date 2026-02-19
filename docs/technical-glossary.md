# 📖 Technical Glossary - Terms Explained Simply

This glossary explains common programming and game development terms you might hear when working with AI agents, without requiring any coding knowledge.

---

## General Programming Terms

### **Algorithm**
**Simple definition:** A step-by-step recipe for solving a problem.

**Example:** An algorithm for making a sandwich:
1. Get two slices of bread
2. Add ingredients
3. Put slices together
4. Done!

**In your game:** The algorithm for enemy movement might be:
1. Find the shortest path to player's castle
2. Move one step along that path
3. If blocked, recalculate path
4. Repeat

---

### **API (Application Programming Interface)**
**Simple definition:** A menu of things your game can do or request from other systems.

**Real-world analogy:** Like a restaurant menu - you don't need to know how the kitchen works, you just order from the menu.

**In your game:** If you use a sound system API, you can play sounds without knowing how audio processing works.

---

### **Bug**
**Simple definition:** A mistake or error in the code that causes unexpected behavior.

**Origin:** Named after an actual moth that got stuck in an early computer!

**Examples in your game:**
- Tower shoots at empty space instead of enemy
- Player can walk through walls
- Game crashes when boss dies

---

### **Debug**
**Simple definition:** Finding and fixing bugs.

**Think of it as:** Detective work - finding what's wrong and correcting it.

---

### **Function/Method**
**Simple definition:** A reusable piece of code that does one specific thing.

**Real-world analogy:** Like a button on your TV remote - each button does one thing (volume up, channel change, etc.)

**In your game examples:**
- `shootArrow()` - Makes a tower shoot
- `takeDamage(amount)` - Reduces health
- `spawnEnemy()` - Creates a new enemy

---

### **Variable**
**Simple definition:** A container that stores information.

**Real-world analogy:** Like a labeled box - you put something in it and can check what's inside later.

**In your game examples:**
- `playerHealth` - Stores player's current health (e.g., 75)
- `goldAmount` - Stores how much gold player has (e.g., 350)
- `waveNumber` - Stores which wave you're on (e.g., 5)

---

### **Object/Class**
**Simple definition:** A blueprint for creating things in your game.

**Real-world analogy:** 
- **Class** = Cookie cutter (the template)
- **Object** = The actual cookie (made from template)

**In your game:**
- `Tower` class is the blueprint
- Each tower you place is an object created from that blueprint

---

### **Loop**
**Simple definition:** Doing the same thing over and over until a condition is met.

**Real-world example:** "Keep stirring until the sugar dissolves"

**In your game:**
- Check every enemy to see if they're in tower range
- Update every projectile's position
- Play background music on repeat

---

### **Conditional (If/Then)**
**Simple definition:** Making decisions based on conditions.

**Structure:** "IF (something is true) THEN (do this) ELSE (do that)"

**In your game examples:**
- IF player gold >= tower cost THEN allow building
- IF enemy health <= 0 THEN enemy dies
- IF boss health < 50% THEN enter second phase

---

## Game Development Terms

### **Frame**
**Simple definition:** One single image in your game's animation.

**Context:** Games typically show 60 frames per second (60 FPS), making movement look smooth.

**Think of it like:** Flip book animation - each page is a frame.

---

### **Frame Rate (FPS)**
**Simple definition:** How many images your game shows per second.

**Common rates:**
- 60 FPS - Smooth, professional games
- 30 FPS - Acceptable for slower games
- Below 30 FPS - Starts feeling choppy

---

### **Sprite**
**Simple definition:** A 2D image used in your game (characters, objects, etc.)

**In your game:**
- Tower sprite
- Enemy sprite
- Player sprite
- Arrow sprite

---

### **Asset**
**Simple definition:** Any file used in your game (images, sounds, music, etc.)

**Examples:**
- Character sprites (image files)
- Sound effects (audio files)
- Background music (audio files)
- UI icons (image files)

---

### **Collision Detection**
**Simple definition:** Figuring out when two things in your game touch each other.

**In your game:**
- Arrow hitting enemy
- Enemy reaching castle
- Player clicking on tower button

---

### **Hitbox**
**Simple definition:** The invisible boundary around an object used for collision detection.

**Why it matters:** Sometimes the visual sprite and the hitbox don't match perfectly - this can make the game feel unfair if not balanced properly.

---

### **AI (Artificial Intelligence)**
**Simple definition:** Code that makes non-player characters behave intelligently or realistically.

**In your game:**
- Enemy pathfinding (finding route to castle)
- Boss choosing which attack to use
- Tower choosing which enemy to target

---

### **Pathfinding**
**Simple definition:** Calculating the best route from point A to point B.

**In your game:** Enemies finding their way to your castle while avoiding obstacles.

---

### **Game Loop**
**Simple definition:** The main cycle that runs continuously while your game is active.

**The cycle:**
1. Check for player input
2. Update game state (move enemies, etc.)
3. Draw everything on screen
4. Repeat 60 times per second

---

### **State**
**Simple definition:** The current situation or condition of something in your game.

**Examples:**
- Game states: Main Menu, Playing, Paused, Game Over
- Tower states: Idle, Targeting, Firing, Upgrading
- Enemy states: Moving, Attacking, Dead

---

### **UI (User Interface)**
**Simple definition:** All the buttons, menus, and information displays the player interacts with.

**In your game:**
- Health bar
- Gold counter
- Tower build menu
- Pause button

---

### **HUD (Heads-Up Display)**
**Simple definition:** Information shown on screen during gameplay (health, ammo, score, etc.)

**Example:** The health and gold displays that stay visible while you play.

---

## Version Control Terms (Git)

### **Commit**
**Simple definition:** A saved snapshot of your project at a specific point in time.

**Think of it as:** A save point in a video game - you can always go back to it.

---

### **Repository (Repo)**
**Simple definition:** The folder containing your project and all its history.

---

### **Branch**
**Simple definition:** A parallel version of your project where you can experiment without affecting the main version.

**Example:** Test new boss mechanics on a branch while keeping the working version safe.

---

### **Merge**
**Simple definition:** Combining changes from one branch into another.

---

### **Clone**
**Simple definition:** Making a copy of a repository on your computer.

---

### **Push**
**Simple definition:** Uploading your changes to GitHub (or another online host).

---

### **Pull**
**Simple definition:** Downloading changes from GitHub to your computer.

---

### **Pull Request (PR)**
**Simple definition:** Asking to merge your changes into the main project.

**How it works:** 
1. You (or AI agent) make changes on a branch
2. Submit a pull request
3. Review the changes
4. Approve and merge, or request modifications

---

## Data Structure Terms

### **Array/List**
**Simple definition:** An ordered collection of items.

**Real-world analogy:** A shopping list with numbered items.

**In your game:**
```
enemyList = [Enemy1, Enemy2, Enemy3, Enemy4]
```

---

### **Dictionary/Map**
**Simple definition:** A collection where each item has a label/key.

**Real-world analogy:** A real dictionary - you look up a word (key) to find its definition (value).

**In your game:**
```
towerStats = {
  "damage": 10,
  "range": 150,
  "cost": 50
}
```

---

### **String**
**Simple definition:** Text data.

**Examples:** Player names, dialogue, file paths

---

### **Integer (Int)**
**Simple definition:** A whole number (no decimals).

**In your game:** Health points (75), gold amount (250), wave number (3)

---

### **Float**
**Simple definition:** A number with decimals.

**In your game:** Position (45.7), speed (2.5), damage multiplier (1.5x)

---

### **Boolean (Bool)**
**Simple definition:** A true/false value.

**In your game:**
- `isAlive` - true or false
- `hasUpgrade` - true or false
- `isPaused` - true or false

---

## Game Mechanics Terms

### **Cooldown**
**Simple definition:** A waiting period before something can be used again.

**In your game:** Time between tower shots, time before next unit can spawn.

---

### **Spawn**
**Simple definition:** To create or bring into existence.

**In your game:** When a new enemy appears, we say it "spawns."

---

### **DPS (Damage Per Second)**
**Simple definition:** How much damage something deals over one second of time.

**Used for:** Comparing tower effectiveness, balancing combat.

---

### **AOE (Area of Effect)**
**Simple definition:** Affects multiple targets in an area, not just one.

**Example:** A tower that shoots fire in a circle, damaging all enemies within range.

---

### **Buff**
**Simple definition:** A positive effect that makes something stronger temporarily.

**In your game:** Speed buff, damage buff, defense buff.

---

### **Debuff**
**Simple definition:** A negative effect that makes something weaker temporarily.

**In your game:** Slow effect, poison, armor reduction.

---

### **Nerf**
**Simple definition:** To make something weaker (used in balancing).

**Example:** "Let's nerf the archer tower, it's too powerful."

---

### **Buff (balancing)**
**Simple definition:** To make something stronger (used in balancing).

**Example:** "Let's buff the basic enemies, they die too quickly."

---

### **Balance**
**Simple definition:** Adjusting game elements so nothing is too weak or too powerful.

**Goal:** Make the game challenging but fair and fun.

---

## Performance Terms

### **FPS Drop/Lag**
**Simple definition:** When the game suddenly runs slower or choppier.

**Causes:** Too many enemies, complex effects, not optimized code.

---

### **Optimization**
**Simple definition:** Making your game run faster and smoother.

**Methods:**
- Reducing number of objects
- Simplifying effects
- Better code efficiency

---

### **Bottleneck**
**Simple definition:** The slowest part of your game that limits overall performance.

**Analogy:** Like traffic - one slow lane causes backups everywhere.

---

## Development Process Terms

### **MVP (Minimum Viable Product)**
**Simple definition:** The simplest version of your game that's still playable and fun.

**In your design doc:** 1 level, 1 tower, 2 units, 1 boss - that's your MVP!

---

### **Iteration**
**Simple definition:** The process of making something, testing it, and improving it repeatedly.

**Process:**
1. Build version 1
2. Test and gather feedback
3. Improve (version 2)
4. Test again
5. Repeat until great!

---

### **Prototype**
**Simple definition:** A rough, early version made to test if an idea works.

**Purpose:** Test gameplay before spending time on graphics and polish.

---

### **Polish**
**Simple definition:** Adding the final touches that make a game feel professional.

**Examples:**
- Smooth animations
- Particle effects
- Sound effects
- Screen shake on impacts
- Satisfying feedback

---

### **Refactor**
**Simple definition:** Reorganizing code to work better without changing what it does.

**Why:** Like reorganizing a messy closet - everything's still there, just arranged better.

---

### **Tech Debt**
**Simple definition:** Shortcuts or messy code that will cause problems later if not fixed.

**Analogy:** Like cleaning your room - if you keep stuffing things under the bed, eventually you'll have a big problem!

---

### **Edge Case**
**Simple definition:** An unusual situation that might break your game.

**Examples:**
- What if player has exactly 0 gold?
- What if 100 enemies spawn at once?
- What if tower targets enemy that just died?

---

## Testing Terms

### **Playtesting**
**Simple definition:** Having people play your game to find problems and get feedback.

---

### **QA (Quality Assurance)**
**Simple definition:** Systematic testing to find bugs and problems.

---

### **Regression**
**Simple definition:** When fixing one thing accidentally breaks something that was working.

**Example:** You fix tower targeting, but now towers don't deal damage!

---

## When You Hear These, Here's What to Do:

### "We need to refactor this"
**Translation:** "Let's reorganize the code to be cleaner"
**Your response:** "Okay, will it change how the game plays?" (Usually no)

### "There's a bottleneck in the enemy spawning"
**Translation:** "Creating enemies is slow and causes lag"
**Your response:** "Can we optimize it or spawn fewer enemies?"

### "This feature has too much tech debt"
**Translation:** "This was coded messily and should be redone properly"
**Your response:** "Will redoing it improve the game or fix bugs?"

### "We need to balance the DPS"
**Translation:** "Some towers/enemies deal too much or too little damage"
**Your response:** "Let's test different damage values and see what feels right"

---

## Quick Reference Guide

When an AI agent uses a term you don't understand:

1. **Check this glossary first** 📖
2. **Ask them to explain simply** 💭
   - "Can you explain [term] in simple terms?"
   - "What does [term] mean for my game?"
3. **Ask for an example** 🎯
   - "Can you give me an example using my game?"
4. **Don't be afraid to ask** 🙋
   - No question is stupid!
   - Understanding is more important than pretending to know

---

## Remember

You don't need to memorize all these terms! This glossary is here as a reference when you need it. The more you work with AI agents, the more naturally these terms will make sense in context.

**Your focus should be on:**
- What you want your game to do ✅
- How it should feel to play ✅
- What's fun and what's not ✅

Let the AI agents worry about the technical terms! 🚀
