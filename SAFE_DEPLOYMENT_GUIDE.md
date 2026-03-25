# FishTrack Safe Deployment Guide

**Goal:** Test changes before they go live, don't break production

---

## 🎯 The Problem

**Current workflow (DANGEROUS):**
```
Make change → git push → Netlify auto-deploys → LIVE on fishtrack-sa.netlify.app
```

**Risk:** Bug goes straight to production → Users see broken app → Lost trust

**What you need:**
1. **Development environment** (test locally)
2. **Staging environment** (preview online before production)
3. **Production environment** (live site, only deploy tested changes)

---

## ✅ The Solution: 3-Environment Setup

### Environment 1: Local Development (Your Computer)
**Purpose:** Make changes, test immediately, see results in browser

**How it works:**
1. Make changes to code (index.html, CSS, JS)
2. Open file in browser (file:///path/to/index.html)
3. See changes instantly (refresh browser)
4. Test all features (catch bugs before committing)

**Pros:**
- Instant feedback (no deploy wait)
- Unlimited experiments (no cost)
- Safe (only you see it)

**Cons:**
- Some features don't work locally (Firebase needs HTTPS)
- Can't share with others for testing

---

### Environment 2: Staging (Netlify Branch Deploy)
**Purpose:** Preview changes online (real HTTPS, Firebase works) before going live

**How it works:**
1. Create `dev` branch in Git
2. Push changes to `dev` branch
3. Netlify auto-deploys to: `dev--fishtrack-sa.netlify.app`
4. Test the preview URL (real environment, not production)
5. If it works → Merge `dev` into `main` → Goes live

**Pros:**
- Real environment (HTTPS, Firebase, real URLs)
- Shareable (send preview URL to testers)
- Safe (production is untouched)

**Cons:**
- Requires Git branch management (learn once, use forever)

---

### Environment 3: Production (Live Site)
**Purpose:** What users see (fishtrack-sa.netlify.app)

**How it works:**
1. Only deploy to `main` branch when staging tests pass
2. Netlify auto-deploys `main` → Production
3. Users always see working version

**Protection:**
- Never push untested code to `main`
- Only merge from `dev` after testing
- Production is sacred (don't experiment here)

---

## 🔧 Setup Instructions (One-Time, 10 Minutes)

### Step 1: Enable Netlify Branch Deploys

**Go to Netlify Dashboard:**
1. Visit: https://app.netlify.com/sites/fishtrack-sa/settings/deploys
2. Scroll to **"Deploy contexts"**
3. Under **"Branch deploys"**, select **"All"**
4. Click **"Save"**

**Result:** Netlify will now auto-deploy ANY branch you push, not just `main`

---

### Step 2: Create Development Branch

**In your local FishTrack folder:**

```bash
cd ~/fishtrack-sa  # Or wherever your FishTrack code is

# Create and switch to dev branch
git checkout -b dev

# Push dev branch to GitHub
git push -u origin dev
```

**Result:** You now have two branches:
- `main` = Production (live site)
- `dev` = Staging (preview site)

---

### Step 3: Configure Branch Deploy URL

**Netlify automatically creates:**
- Production: `fishtrack-sa.netlify.app` (from `main` branch)
- Staging: `dev--fishtrack-sa.netlify.app` (from `dev` branch)

**Bookmark these:**
- **Production:** https://fishtrack-sa.netlify.app
- **Staging:** https://dev--fishtrack-sa.netlify.app

---

## 📋 Daily Workflow (Making Changes Safely)

### Scenario: Add New Feature (e.g., "Fish of the Day" widget)

#### Step 1: Switch to Dev Branch
```bash
cd ~/fishtrack-sa
git checkout dev
```

#### Step 2: Make Your Changes
Edit files (index.html, CSS, JS):
```bash
nano index.html  # Add "Fish of the Day" HTML
nano css/style.css  # Add styling
nano js/fish-of-day.js  # Add functionality
```

#### Step 3: Test Locally (Quick Check)
Open in browser:
```bash
firefox index.html  # Or chrome, safari, etc.
```

Check:
- [ ] Feature displays correctly
- [ ] No console errors (F12 → Console tab)
- [ ] Looks good on mobile (F12 → Responsive mode)

#### Step 4: Commit Changes
```bash
git add .
git commit -m "Add Fish of the Day widget"
```

#### Step 5: Push to Dev Branch
```bash
git push origin dev
```

**Netlify auto-deploys to:** https://dev--fishtrack-sa.netlify.app

#### Step 6: Test Staging Environment
1. Wait 1-2 minutes for Netlify deploy
2. Visit: https://dev--fishtrack-sa.netlify.app
3. Test everything:
   - [ ] Fish of the Day widget works
   - [ ] Firebase connection works (log a test catch)
   - [ ] Map loads correctly
   - [ ] Mobile responsive (test on phone)
   - [ ] No JavaScript errors (F12 → Console)

#### Step 7: Share with Testers (Optional)
Send staging URL to friends:
> "Hey James, can you test this new feature? https://dev--fishtrack-sa.netlify.app"

Get feedback BEFORE going live.

#### Step 8: Deploy to Production (Only If Tests Pass)
```bash
# Switch to main branch
git checkout main

# Merge dev into main (brings changes from dev → main)
git merge dev

# Push to GitHub (triggers production deploy)
git push origin main
```

**Netlify auto-deploys to:** https://fishtrack-sa.netlify.app (LIVE)

#### Step 9: Verify Production
Visit production URL, check feature works live.

---

## 🚨 If Something Breaks (Emergency Rollback)

### Option 1: Quick Fix (Small Bug)
```bash
# Fix the bug in dev branch
git checkout dev
nano index.html  # Fix the bug
git add .
git commit -m "Fix: Correct Fish of the Day display bug"
git push origin dev

# Test on staging
# Visit: https://dev--fishtrack-sa.netlify.app

# If fixed, deploy to production
git checkout main
git merge dev
git push origin main
```

---

### Option 2: Full Rollback (Major Breakage)
```bash
# Find last working commit
git log --oneline  # Shows commit history

# Example output:
# abc123 Add Fish of the Day widget (BROKEN)
# def456 Fix catch logging bug (LAST GOOD VERSION)
# ghi789 Update homepage design

# Rollback to last good commit (def456)
git checkout main
git revert abc123  # Undoes the broken commit
git push origin main
```

**Netlify auto-deploys:** Production is restored to last working version.

---

### Option 3: Nuclear Rollback (Restore to v3.0.0-STABLE)
```bash
# You locked v3.0.0 as stable version (remember VERSION-LOCK.md?)
git checkout v3.0.0-stable  # Restore to locked stable version
git checkout -b emergency-restore
git push origin emergency-restore

# Netlify deploys: https://emergency-restore--fishtrack-sa.netlify.app

# Test it works, then:
git checkout main
git reset --hard v3.0.0-stable
git push --force origin main  # WARNING: This is destructive!
```

**Use this ONLY in emergency** (production completely broken, need immediate restore).

---

## 📊 Deployment Checklist (Before Merging to Main)

### Pre-Deployment Testing (On Staging)

**Functional Tests:**
- [ ] All pages load without errors
- [ ] Log a catch works (Firebase connection)
- [ ] Map displays catches correctly
- [ ] Activity feed shows recent catches
- [ ] Photo upload works
- [ ] Tide/wind widget displays data
- [ ] Weight calculator works
- [ ] Secret Spot mode works (if testing privacy)

**Browser Tests:**
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop, if on Mac)
- [ ] Chrome (mobile - use F12 responsive mode)
- [ ] Safari (actual iPhone, if available)

**Console Errors:**
- [ ] F12 → Console → No red errors (warnings OK)
- [ ] Network tab → No failed requests (red entries)

**Performance:**
- [ ] Page loads in < 3 seconds
- [ ] Firebase queries return in < 1 second
- [ ] Images load correctly

**Mobile Responsive:**
- [ ] Header doesn't overflow
- [ ] Buttons are tappable (not too small)
- [ ] Forms are usable (inputs not cut off)
- [ ] Map is interactive (zoom, pan work)

**User Testing (Optional but Recommended):**
- [ ] Send staging URL to 1-2 trusted testers
- [ ] Get feedback: "Does this work? Any bugs?"
- [ ] Fix issues BEFORE merging to main

**If ALL tests pass → Merge to main (deploy to production)**

**If ANY test fails → Fix in dev, re-test, repeat**

---

## 🎯 Branch Strategy Summary

### Main Branch (Production)
- **URL:** https://fishtrack-sa.netlify.app
- **Purpose:** Live site, users see this
- **Rule:** Only merge from `dev` after testing
- **Protection:** Never experiment here, never push untested code

### Dev Branch (Staging)
- **URL:** https://dev--fishtrack-sa.netlify.app
- **Purpose:** Test changes before going live
- **Rule:** Experiment freely, test thoroughly
- **Workflow:** Make changes → Push to `dev` → Test → Merge to `main`

### Feature Branches (Optional Advanced)
- **Example:** `feature/fish-of-day`, `fix/catch-logger-bug`
- **Purpose:** Isolate big features (multiple days of work)
- **Workflow:** Create feature branch → Work → Merge to `dev` → Test → Merge to `main`

---

## 💡 Pro Tips

### Tip 1: Always Work in Dev Branch
```bash
# Daily workflow:
git checkout dev  # Start here EVERY TIME
# Make changes
git add .
git commit -m "Description of change"
git push origin dev
# Test on staging
# If good, merge to main
```

### Tip 2: Use Descriptive Commit Messages
**Bad:** `git commit -m "fix"`  
**Good:** `git commit -m "Fix: Catch logging form race condition (DOMContentLoaded wrapper)"`

**Why:** If you need to rollback, descriptive messages help find the right commit.

### Tip 3: Test on Actual Devices
Staging URL works on ANY device:
- Share https://dev--fishtrack-sa.netlify.app with your phone
- Test on real iPhone/Android (not just browser emulation)
- Catch issues desktop testing misses

### Tip 4: Deploy During Low Traffic
**Best time to deploy:** Early morning (6-8 AM) or late night (10 PM - midnight)  
**Why:** Fewer users online = less impact if something breaks

### Tip 5: Monitor After Deploy
After merging to `main`:
1. Wait 2-3 minutes for Netlify deploy
2. Visit production URL
3. Check F12 Console for errors
4. Test 1-2 critical features (log catch, view map)
5. Monitor for 10-15 minutes (watch for user reports)

**If issue found:** Quick fix in `dev`, test, merge to `main` (hotfix workflow)

---

## 🔄 Example: Full Feature Development Workflow

### Day 1: Build Feature (Dev Branch)
```bash
git checkout dev
# Add "Fish of the Day" widget
git add .
git commit -m "Add Fish of the Day widget (initial version)"
git push origin dev
```
**Test on:** https://dev--fishtrack-sa.netlify.app

### Day 2: Refine Feature (Dev Branch)
```bash
git checkout dev
# Improve styling, add animations
git add .
git commit -m "Improve Fish of the Day styling and animations"
git push origin dev
```
**Test again on staging**

### Day 3: User Testing (Dev Branch)
Send to testers:
> "Hey James, Adriaan - new feature on staging. Let me know if you see bugs: https://dev--fishtrack-sa.netlify.app"

Get feedback:
> James: "Widget looks great but image doesn't load on my phone"

Fix bug:
```bash
git checkout dev
# Fix image loading issue
git add .
git commit -m "Fix: Fish of the Day image loading on mobile (use responsive image)"
git push origin dev
```

### Day 4: Deploy to Production (Main Branch)
All tests pass, testers happy:
```bash
git checkout main
git merge dev
git push origin main
```

**Live on:** https://fishtrack-sa.netlify.app

Users see polished feature, not buggy half-done version. ✅

---

## 📚 Quick Reference

### Common Git Commands

```bash
# Switch to dev branch
git checkout dev

# Create new feature branch
git checkout -b feature/new-feature

# See which branch you're on
git branch

# Commit changes
git add .
git commit -m "Description"

# Push to current branch
git push origin <branch-name>

# Merge dev into main (deploy to production)
git checkout main
git merge dev
git push origin main

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (DANGEROUS)
git reset --hard HEAD
```

### Netlify URLs

- **Production:** https://fishtrack-sa.netlify.app
- **Staging (dev branch):** https://dev--fishtrack-sa.netlify.app
- **Feature branch:** https://feature-branch-name--fishtrack-sa.netlify.app

### When to Deploy

**Deploy to dev (staging):**
- ✅ Any time (experiment freely)
- ✅ Multiple times per day
- ✅ Incomplete features OK (you're testing)

**Deploy to main (production):**
- ⚠️ Only after staging tests pass
- ⚠️ Once per day MAX (unless hotfix)
- ⚠️ Only complete, tested features

---

## 🎯 Summary

**The Safe Way:**
1. Make changes in `dev` branch
2. Push to GitHub → Netlify deploys to staging (dev--fishtrack-sa.netlify.app)
3. Test staging thoroughly (checklist above)
4. If tests pass → Merge `dev` into `main`
5. Push `main` → Netlify deploys to production (fishtrack-sa.netlify.app)

**The Dangerous Way (DON'T DO THIS):**
1. Make changes in `main` branch
2. Push to GitHub → Goes straight to production
3. Users see bugs immediately
4. Panic rollback required

---

**Use the safe way. Test in staging. Keep production stable.**

Your users will thank you. 🚀
