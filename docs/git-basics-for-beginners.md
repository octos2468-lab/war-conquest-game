# 📚 Git Basics for Complete Beginners

## What is Git?

**Git** is like a "save game" system for your project, but way more powerful. Instead of just having one save file, you can have multiple versions of your work, go back in time, and collaborate with others.

Think of it like this:
- 🎮 **Video game save**: You can save your progress and load it later
- 📝 **Google Docs version history**: You can see who changed what and when
- ⏰ **Time machine**: You can go back to any previous version

Git combines all of these into one system for managing your game project!

---

## Key Concepts Explained Simply

### 🗂️ Repository (Repo)
**What it is:** A folder that contains your entire project and all its history.

**Real-world analogy:** Like a filing cabinet that stores all versions of your documents, not just the current one.

**Your repo:** `war-conquest-game` is your repository on GitHub!

---

### 💾 Commit
**What it is:** A "snapshot" or "checkpoint" of your project at a specific moment in time.

**Real-world analogy:** 
- Like taking a photo of your LEGO castle at different stages of building
- Like clicking "Save Version" in Google Docs
- Like a checkpoint in a video game

**What happens when you make a commit:**
1. You tell Git which files you changed
2. You write a short message describing what you did (e.g., "Added player health system")
3. Git saves that version forever - you can always come back to it!

**Example commits in your project:**
- ✅ "Created initial game design document"
- ✅ "Added tower defense mechanics"
- ✅ "Fixed bug in enemy AI"

---

### 🌳 Branch
**What it is:** A separate timeline where you can work on new features without affecting the main version.

**Real-world analogy:** 
- Like creating a "what if" alternate universe for your project
- Like working on a draft document while keeping the published version safe
- Like having multiple save slots in a game

**How it works:**
```
main branch:     A---B---C (stable version)
                  \
feature branch:    D---E (testing new stuff)
```

You can work on branch `D-E` without messing up the main timeline `A-B-C`. When you're happy with your feature, you can **merge** it back into main!

---

### 🔀 Merge
**What it is:** Combining changes from one branch into another.

**Real-world analogy:** Taking your rough draft and adding it to your final document.

---

### 🌐 GitHub
**What it is:** A website that hosts your Git repositories online so you can:
- Back up your work in the cloud
- Share it with others
- Collaborate with team members (or AI agents!)
- Keep track of issues and tasks

**Think of it as:** Google Drive, but specifically designed for code and projects.

---

### 🔄 Push
**What it is:** Uploading your local commits to GitHub (or another remote server).

**Real-world analogy:** Uploading your document to Google Drive so others can see it.

---

### ⬇️ Pull
**What it is:** Downloading changes from GitHub to your computer.

**Real-world analogy:** Downloading the latest version of a shared document.

---

### 📁 Working Directory
**What it is:** The actual folder on your computer where you edit files.

---

### 📦 Staging Area
**What it is:** A "waiting room" where you put files before committing them.

**Why it exists:** So you can choose exactly which changes to include in your commit.

**Process:**
1. You edit files in your working directory
2. You "stage" the files you want to commit (put them in the waiting room)
3. You commit the staged files (take the snapshot)

---

## Basic Git Workflow

Here's what typically happens when working on your game:

```
1. Make changes to files
   └─> Edit game-design.md, add new features

2. Stage your changes
   └─> Tell Git "these are the files I want to save"
   └─> Command: git add filename.md

3. Commit your changes
   └─> Save the snapshot with a message
   └─> Command: git commit -m "Added boss battle mechanics"

4. Push to GitHub
   └─> Upload your commits online
   └─> Command: git push
```

---

## Common Terms You'll See

| Term | What It Means |
|------|---------------|
| **HEAD** | Where you currently are in the project's history (usually the latest commit) |
| **Origin** | The default name for your GitHub repository |
| **Clone** | Making a copy of a repository on your computer |
| **Fork** | Making your own copy of someone else's repository |
| **Pull Request (PR)** | Asking to merge your changes into the main project |
| **Conflict** | When two people edit the same part of a file differently |
| **Diff** | The differences between two versions of a file |

---

## Why This Matters for Your Game

When you work with AI agents to build your game:

1. **Safety Net** 🛡️
   - Every change is saved
   - You can always undo mistakes
   - Nothing is ever truly lost

2. **Clear History** 📖
   - You can see exactly what changed and when
   - Helps you understand how your game evolved

3. **Collaboration** 🤝
   - AI agents can make changes
   - You can review what they did
   - You can accept or reject their changes

4. **Organization** 📋
   - Keep different features separate with branches
   - Test things without breaking the main version
   - Track bugs and features with GitHub issues

---

## Next Steps

Now that you understand Git basics, check out:
- **working-with-ai-agents.md** - How to use AI to build your game
- **technical-glossary.md** - More terms explained simply
- **game-dev-workflow.md** - Step-by-step process for building your game

---

## Quick Reference

**To see what changed:**
```bash
git status    # What files changed?
git diff      # Show exact changes
```

**To save your work:**
```bash
git add .                           # Stage all changes
git commit -m "Description here"    # Commit with message
git push                            # Upload to GitHub
```

**To see history:**
```bash
git log       # See all commits
```

---

Remember: Git might seem complicated at first, but you're basically just:
1. **Making changes** to files
2. **Saving snapshots** (commits) of those changes
3. **Uploading them** to GitHub (push)

That's it! Everything else is just extra features to make this process more powerful. 🚀
