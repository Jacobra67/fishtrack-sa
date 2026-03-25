# FishTrack Testing Checklist

**Before deploying to production**, copy this checklist and test on staging:  
**Staging URL:** https://dev--fishtrack-sa.netlify.app

---

## ✅ Functional Tests

### Homepage
- [ ] Page loads without errors
- [ ] Logo displays correctly
- [ ] Navigation menu works (all links)
- [ ] Hero section displays
- [ ] "Log a Catch" button works
- [ ] Footer displays correctly

### Log a Catch
- [ ] Form displays all fields
- [ ] Date picker works
- [ ] Species dropdown populates
- [ ] Photo upload works (select image)
- [ ] Location picker works (click map)
- [ ] GPS coordinates auto-fill
- [ ] Weight calculator button works
- [ ] Privacy mode selector works (Public/Friends/Secret Spot)
- [ ] Conditions fields display (if using auto-fill)
- [ ] Submit button works
- [ ] Success message appears after submit
- [ ] Catch appears on map immediately
- [ ] Catch appears in activity feed

### Map View
- [ ] Map loads (OpenStreetMap tiles)
- [ ] Catches display as markers
- [ ] Click marker shows popup
- [ ] Popup shows: photo, species, weight, date, catcher
- [ ] "More Info" dropdown works (conditions, location)
- [ ] Map zoom works (+ - buttons)
- [ ] Map pan works (drag)
- [ ] Cluster markers work (multiple catches in same area)
- [ ] Secret Spot catches show fuzzy location (2km circle)

### Activity Feed
- [ ] Feed displays recent catches
- [ ] Catches sorted newest first
- [ ] Each catch shows: photo, species, weight, date, catcher, location
- [ ] Photo loads correctly
- [ ] Click catch card shows details
- [ ] "Load More" button works (if pagination)
- [ ] Empty state displays if no catches

### Weight Calculator
- [ ] Calculator modal opens
- [ ] Species dropdown populates
- [ ] Length input works
- [ ] Girth input works (for some species)
- [ ] Calculate button works
- [ ] Result displays in kg
- [ ] Result auto-fills in main form
- [ ] Close button works

### Tide/Wind Widget (if present)
- [ ] Widget displays
- [ ] Location selector works
- [ ] Tide data displays (high/low times)
- [ ] Wind data displays (speed, direction)
- [ ] Temperature displays
- [ ] Data updates when location changed

---

## 📱 Mobile Responsive Tests

**Open F12 → Responsive mode, or test on actual phone**

### Mobile (375px width)
- [ ] Header doesn't overflow
- [ ] Navigation menu is hamburger (3 lines)
- [ ] Hamburger menu opens/closes
- [ ] Logo scales appropriately
- [ ] Form fields are full-width
- [ ] Buttons are tappable (minimum 44px touch target)
- [ ] Map displays correctly
- [ ] Activity feed cards stack vertically
- [ ] Photos scale to fit screen
- [ ] No horizontal scrolling

### Tablet (768px width)
- [ ] Layout adjusts appropriately
- [ ] Two-column layout (if designed)
- [ ] Map sidebar works
- [ ] Navigation displays horizontally

### Desktop (1200px+ width)
- [ ] Full layout displays
- [ ] Map takes appropriate space
- [ ] Activity feed is side-by-side or grid
- [ ] All features accessible

---

## 🌐 Browser Compatibility Tests

### Desktop Browsers
- [ ] **Chrome** (latest): All features work
- [ ] **Firefox** (latest): All features work
- [ ] **Safari** (latest, if on Mac): All features work
- [ ] **Edge** (latest): All features work

### Mobile Browsers
- [ ] **Chrome (Android)**: All features work
- [ ] **Safari (iOS)**: All features work
- [ ] **Samsung Internet**: All features work (if testing on Samsung)

---

## 🔍 Console Error Check

**Open F12 → Console tab:**
- [ ] No red errors (warnings in yellow are OK)
- [ ] No failed network requests (check Network tab)
- [ ] No Firebase authentication errors
- [ ] No JavaScript errors on page load
- [ ] No JavaScript errors when submitting form
- [ ] No JavaScript errors when clicking map

---

## 🔥 Firebase Tests

### Connection
- [ ] Firebase initializes (check console log)
- [ ] No authentication errors
- [ ] Firestore connection works

### Data Operations
- [ ] Create: Log a catch → Appears in Firestore (check Firebase Console)
- [ ] Read: Catches display on map and feed
- [ ] Update: Edit catch (if feature exists) → Changes saved
- [ ] Delete: Delete catch (if feature exists) → Removed from Firestore

### Security Rules
- [ ] Can create catches without authentication (if public mode)
- [ ] Can read all public catches
- [ ] Secret Spot catches show fuzzy location (not exact GPS)

---

## ⚡ Performance Tests

### Page Load Speed
- [ ] Homepage loads in < 3 seconds
- [ ] Map view loads in < 5 seconds
- [ ] Activity feed loads in < 3 seconds

### Firebase Query Speed
- [ ] Catch list query returns in < 1 second
- [ ] Map markers load in < 2 seconds

### Image Loading
- [ ] Photos load progressively (not blocking page)
- [ ] Large photos don't crash browser
- [ ] Photos display at correct size (not oversized)

---

## 🧪 Edge Case Tests

### Empty States
- [ ] No catches in database: "No catches yet" message displays
- [ ] Search with no results: "No catches found" displays
- [ ] Failed Firebase connection: Error message displays

### Error Handling
- [ ] Submit form with missing required field: Validation error shows
- [ ] Submit form with invalid data: Error message shows
- [ ] Network offline: Graceful degradation (error message, not crash)
- [ ] Photo too large (> 5MB): Error message or auto-resize

### Data Edge Cases
- [ ] Catch with no photo: Default placeholder image displays
- [ ] Catch with very long species name: Truncates or wraps correctly
- [ ] Catch with 0kg weight: Displays correctly (not "undefined")
- [ ] Catch with future date: Validation prevents or allows (depends on design)

---

## 👥 User Testing (Optional but Recommended)

**Send staging URL to 2-3 trusted friends:**

1. **James** (shore angler, experienced)
   - [ ] Can log a catch without help
   - [ ] Finds Secret Spot mode easily
   - [ ] No confusion about privacy settings
   - [ ] Reports any bugs or UX issues

2. **Adriaan** (casual fisher)
   - [ ] Can navigate site without instructions
   - [ ] Understands how to use features
   - [ ] Reports any unclear labels/buttons

3. **Chris** (tech-savvy)
   - [ ] Tests on mobile device
   - [ ] Checks for performance issues
   - [ ] Reports any browser compatibility bugs

**Ask them:**
- "Can you log a test catch?"
- "Did you encounter any bugs?"
- "Was anything confusing?"
- "Does it work on your phone?"

---

## ✅ Final Checks Before Production Deploy

### Code Quality
- [ ] No `console.log()` debugging statements (or commented out)
- [ ] No hardcoded test data
- [ ] No commented-out code blocks (clean up)
- [ ] All files saved and committed

### Configuration
- [ ] Firebase config keys are correct (not test keys)
- [ ] API keys are valid (WorldTides, Open-Meteo)
- [ ] URLs point to production (not localhost)

### Documentation
- [ ] Commit message is descriptive
- [ ] CHANGELOG updated (if maintaining one)
- [ ] Version number updated (if versioning)

### Rollback Plan
- [ ] Know how to revert if deploy breaks (git revert or git reset)
- [ ] Have v3.0.0-stable tag as fallback
- [ ] Can restore from dev branch if needed

---

## 🚀 Deployment Checklist

**If ALL tests above pass:**

```bash
# Merge dev to main (deploy to production)
git checkout main
git merge dev
git push origin main
```

**After deploy:**
- [ ] Wait 2-3 minutes for Netlify build
- [ ] Visit https://fishtrack-sa.netlify.app
- [ ] Quick smoke test (load page, submit 1 test catch, view map)
- [ ] Monitor F12 Console for errors
- [ ] Watch for user reports (WhatsApp, social media)

**If issues found:**
- Fix in `dev` branch
- Test on staging
- Hotfix deploy to `main`

---

## 📝 Testing Notes Template

**Date:** [YYYY-MM-DD]  
**Branch:** dev  
**Staging URL:** https://dev--fishtrack-sa.netlify.app  
**Changes being tested:** [List of new features or bug fixes]

**Test results:**
- [ ] Passed all functional tests
- [ ] Passed mobile responsive tests
- [ ] Passed browser compatibility tests
- [ ] No console errors
- [ ] Performance acceptable
- [ ] User testing complete (if applicable)

**Issues found:**
1. [Bug description] - **Status:** [Fixed / To be fixed]
2. [Bug description] - **Status:** [Fixed / To be fixed]

**Ready for production:** [YES / NO]

**If NO, what needs fixing:**
- [Issue to fix before deploy]

**If YES, deploy command:**
```bash
git checkout main && git merge dev && git push origin main
```

---

**Keep production stable. Test thoroughly. Users trust you.** 🚀
