# FishTrack Update System

## Problem Solved

Users were getting stuck on old cached versions of the app due to:
- Aggressive browser caching
- Service Worker (PWA) caching strategy
- Users not knowing to hard refresh (Ctrl+Shift+R)

## Solution: 4-Layer Protection

### 1. Version Checker (js/version-check.js)
**What it does:**
- Checks `version.txt` every 60 seconds
- Checks when user returns to app (tab becomes visible)
- Compares current version with server version
- Shows prominent update banner if new version available

**How it works:**
- Current version: Hardcoded in `version-check.js` (e.g., `v3.5.0-2026-03-25`)
- Server version: Fetched from `/version.txt`
- If mismatch → Show update banner

**User experience:**
1. New version deployed
2. User opens app (or returns to app)
3. Banner appears: "🔄 New version available (v3.5.0) - Tap to update!"
4. User taps banner → Page reloads with fresh cache

### 2. Service Worker Update (sw.js)
**What changed:**
- Version bumped: `fishtrack-v2.7` → `fishtrack-v3.5.0`
- Strategy changed: Cache-first → **Network-first for HTML/JS/CSS**
- `version.txt` ALWAYS bypasses cache (critical for detection)

**Network-first strategy:**
1. Try to fetch from network (always check for updates)
2. If network succeeds → Cache the fresh version
3. If network fails (offline) → Serve from cache

**Assets (images, fonts):**
- Still cache-first (faster load times)
- Don't change frequently

### 3. Netlify Cache Headers (netlify.toml)
**What it does:**
- Tells browsers: "Check for updates on EVERY visit"
- HTML/JS/CSS: `max-age=0, must-revalidate` (always verify)
- `version.txt`: `no-cache, no-store` (never cache)
- Assets: `max-age=31536000, immutable` (cache for 1 year)

**Browser behavior:**
- Before: "I have this file, don't check server"
- After: "Let me check if server has a newer version first"

### 4. Version Banner (Automatic)
**What users see:**
```
┌─────────────────────────────────────────────────────┐
│ 🔄 New version available (v3.5.0) - Tap to update! │
└─────────────────────────────────────────────────────┘
```

**Styling:**
- Teal gradient background (`#00CED1`)
- Fixed to top of screen
- Slides down animation
- Clickable (entire banner)

**What happens on click:**
1. Unregister service worker
2. Clear localStorage update flag
3. Hard reload page (bypass cache)

## How to Deploy Updates

### Step 1: Bump Version
Edit `version.txt`:
```
v3.6.0-2026-03-26
```

Edit `js/version-check.js`:
```javascript
const CURRENT_VERSION = 'v3.6.0-2026-03-26';
```

### Step 2: Update Service Worker (if needed)
Edit `sw.js`:
```javascript
const CACHE_NAME = 'fishtrack-v3.6.0';
```

### Step 3: Push to Dev Branch
```bash
git add version.txt js/version-check.js sw.js
git commit -m "Bump version to v3.6.0"
git push origin dev
```

### Step 4: Merge to Main (Production)
```bash
git checkout main
git merge dev
git push origin main
```

### Step 5: Users Get Update Automatically
- Within 60 seconds of visiting the site
- Banner appears → User taps → Fresh version loaded

## Testing the Update System

### Test in Dev Environment:

1. **Change the version:**
   ```bash
   echo "v3.5.1-test" > version.txt
   ```

2. **Don't change `version-check.js`** (leave it at v3.5.0)

3. **Push to dev:**
   ```bash
   git add version.txt
   git commit -m "Test update banner"
   git push origin dev
   ```

4. **Visit staging site:**
   - https://dev--fishtrack-sa.netlify.app
   - Wait 5 seconds
   - Update banner should appear: "🔄 New version available (v3.5.1-test)"

5. **Click banner:**
   - Page should reload
   - Console should show: "🔄 Forcing update - Clearing cache and reloading..."

6. **Revert test:**
   ```bash
   echo "v3.5.0-2026-03-25" > version.txt
   git add version.txt
   git commit -m "Revert test"
   git push origin dev
   ```

## Monitoring

### Check if version checker is working:
Open browser console (F12) on any page:
```
🔍 Version Checker initialized. Current: v3.5.0-2026-03-25
✅ App is up to date: v3.5.0-2026-03-25
```

### Check service worker:
```
[SW] Activating...
[SW] Deleting old cache: fishtrack-v2.7
[SW] Fetching from network: /index.html
```

### Check network requests:
- HTML/JS/CSS should show status `200` (from network)
- Images should show `(from disk cache)`
- `version.txt` should NEVER be from cache

## Troubleshooting

### User says "I don't see new features"

**Option 1: Wait for automatic update**
- Banner appears within 60 seconds
- User clicks banner → Updated

**Option 2: Manual hard refresh**
- Desktop: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Mobile: Settings → Clear browser cache → Reload app

**Option 3: Force service worker reset**
Open console:
```javascript
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
location.reload(true);
```

### Version checker not showing banner

**Check 1: Is version.txt updated?**
```bash
curl https://dev--fishtrack-sa.netlify.app/version.txt
```

**Check 2: Is version-check.js loaded?**
Console should show: "🔍 Version Checker initialized"

**Check 3: Any errors?**
Console should NOT show: "⚠️ Version check failed"

## Best Practices

1. **Always bump version on every deploy** (even small changes)
2. **Use semantic versioning:**
   - Major: v4.0.0 (breaking changes)
   - Minor: v3.6.0 (new features)
   - Patch: v3.5.1 (bug fixes)
3. **Include date in version:** v3.5.0-2026-03-25 (easy to track)
4. **Test in dev first** (staging site)
5. **Monitor console after deploy** (check for errors)

## Cache Strategy Summary

| File Type | Strategy | Cache Duration | Why |
|-----------|----------|----------------|-----|
| HTML | Network-first | 0 seconds | Always check for updates |
| JS | Network-first | 0 seconds | Always check for updates |
| CSS | Network-first | 0 seconds | Always check for updates |
| version.txt | No cache | Never | Critical for update detection |
| sw.js | No cache | Never | Service worker must always be fresh |
| Images | Cache-first | 1 year | Rarely change, faster load |
| Fonts | Cache-first | 1 year | Never change |

## Future Improvements

1. **Push notifications** - Alert users about updates (requires opt-in)
2. **Silent updates** - Update in background, apply on next visit
3. **Changelog modal** - Show "What's New" after update
4. **Update progress** - Show loading spinner during update
5. **Offline queue** - Sync catches logged while offline

---

**Result:** Users will ALWAYS be on the latest version within 60 seconds of a deploy. No more stale cache issues! 🎉
