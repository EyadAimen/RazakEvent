# Git Workflow Guide

## Overview

We use **Git**, **GitHub**, and **Jira** to collaborate on code. Every piece of work is tracked by a Jira ticket with an ID that starts with **`KAN-`**. This ID **must** appear in your branch name, every commit message, and your Pull Request title.

## Branch Structure

```
main          ← Production (don't touch directly!)
  ↓
develop       ← Integration branch (where features merge)
  ↓
feature/*     ← Your work happens here
```

> **Important:** `main` is deployed to production. `develop` is the active integration branch. You should never commit directly to either.

---

## Jira Ticket ID Rule — `KAN-XX`

Every task on our Jira board has a ticket ID like `KAN-12`, `KAN-45`, etc. This ID **must** be included in:

| Where | Example |
|---|---|
| **Branch name** | `feature/KAN-12-events-page` |
| **Every commit message** | `feat: KAN-12 add events page with calendar` |
| **Pull Request title** | `KAN-12: Add events page with calendar view` |

This links your code changes to the Jira ticket automatically and keeps our project tracking accurate.

> ⚠️ **Automated Enforcement:** A GitHub Actions workflow (`.github/workflows/pr-title-checker.yml`) runs automatically on every Pull Request. It checks that your PR title contains a valid `KAN-` ticket ID. If the ID is missing, the check will **fail** and the PR **cannot be merged** until you fix the title.

---

## Daily Workflow

### Step 1: Get Latest Code

**Every time you start working:**
```bash
# Switch to develop branch
git checkout develop

# Get latest changes
git pull origin develop
```

### Step 2: Create Your Feature Branch

Find your **Jira ticket ID** (e.g. `KAN-12`) and include it in the branch name:

```bash
# Create and switch to new branch
git checkout -b feature/KAN-12-events-page

# More examples:
# git checkout -b feature/KAN-5-header-component
# git checkout -b fix/KAN-23-mobile-menu-bug
# git checkout -b design/KAN-8-hero-section
```

**Branch Naming Rules:**
- Always include the `KAN-XX` ticket ID
- Start with `feature/` for new features
- Start with `fix/` for bug fixes
- Start with `design/` for design/UI updates
- Use lowercase and dashes after the ticket ID: `feature/KAN-12-events-page`

### Step 3: Make Your Changes

Edit files, add features, fix bugs...

**Check what you changed:**
```bash
git status
```

### Step 4: Commit Your Changes

**Add files to commit:**
```bash
# Add all changed files
git add .

# Or add specific files
git add src/components/Header.tsx
```

**Create commit (always include `KAN-XX`):**
```bash
git commit -m "feat: KAN-12 add events page with calendar"
```

**Commit Message Format:**
```
<type>: KAN-XX <short description>
```

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `design:` | Visual / UI update |
| `docs:` | Documentation changes |
| `refactor:` | Code improvement (no new features) |

**Good Examples:**
- ✅ `feat: KAN-12 add events page with calendar`
- ✅ `fix: KAN-23 resolve mobile navigation bug`
- ✅ `design: KAN-8 update hero section colors`
- ✅ `docs: KAN-3 add API endpoint documentation`

**Bad Examples:**
- ❌ `updated stuff` — no ticket ID, too vague
- ❌ `KAN-12` — no description
- ❌ `fixed everything` — no ticket ID, not descriptive

### Step 5: Push to GitHub

**First time pushing your branch:**
```bash
git push -u origin feature/KAN-12-events-page
```

**After that, just:**
```bash
git push
```

### Step 6: Create Pull Request

1. Go to the GitHub repository
2. You'll see a yellow banner **"Compare & pull request"** — click it
3. Fill in the form:
   - **Base:** `develop` ← (not main!)
   - **Compare:** your feature branch
   - **Title:** `KAN-12: Add events page with calendar view`
   - **Description:** What did you change and why?
4. Click **"Create Pull Request"**

**Example PR Description:**
```
## KAN-12: Add Events Page

### What I Changed
- Added the Events page with calendar view and event cards
- Created EventCard and EventCalendarView components
- Connected to the events API endpoint

### Screenshots
(attach any relevant screenshots here)
```

### Step 7: Get Code Review

- Request a review from a team member
- Wait for approval
- Make changes if requested (commit with the same `KAN-XX` ID)
- Once approved, the team lead will merge your PR

### Step 8: After Merge

**Clean up and start your next task:**
```bash
# Switch back to develop
git checkout develop

# Get latest (includes your merged code!)
git pull origin develop

# Delete your old branch locally
git branch -d feature/KAN-12-events-page

# Start next feature (with its own KAN ticket)
git checkout -b feature/KAN-15-next-task
```

---

## Quick Reference

**Check what changed:**
```bash
git status
```

**See your commits:**
```bash
git log --oneline -10
```

**Undo changes (before commit):**
```bash
git restore filename.tsx
```

**Update your branch with latest develop:**
```bash
git checkout develop
git pull origin develop
git checkout feature/KAN-12-events-page
git merge develop
```

---

## Rules

1. **Never commit directly to `main` or `develop`**
2. **Always work in a feature branch**
3. **Always include `KAN-XX` in branch names, commits, and PRs**
4. **Pull latest `develop` before starting new work**
5. **Write clear commit messages**
6. **Get code review before merging**
7. **Delete your branch after merging**

---

## Common Commands Cheat Sheet

| What you want to do | Command |
|---|---|
| Get latest code | `git pull origin develop` |
| Create new branch | `git checkout -b feature/KAN-XX-name` |
| See what changed | `git status` |
| Add all changes | `git add .` |
| Commit changes | `git commit -m "feat: KAN-XX description"` |
| Push to GitHub | `git push` |
| Switch branches | `git checkout branch-name` |
| List all branches | `git branch` |
| Delete merged branch | `git branch -d feature/KAN-XX-name` |
