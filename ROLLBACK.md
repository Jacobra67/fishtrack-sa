# EMERGENCY ROLLBACK INSTRUCTIONS

**Date:** 2026-03-25
**Production Deploy:** v3.5.1-2026-03-25

## 🚨 IF PRODUCTION BREAKS - DO THIS IMMEDIATELY:

### Option 1: Git Rollback (Recommended)

```bash
cd ~/.openclaw/workspace/fishtrack-sa

# Reset main branch to last known good version
git checkout main
git reset --hard 3c9fc11  # Last production commit (March 21)
git push origin main --force

# Netlify will auto-deploy in ~2 minutes
```

**This reverts to:** March 21 version (before all today's changes)

---

### Option 2: Netlify Rollback (Fastest)

1. **Go to:** https://app.netlify.com
2. **Login** with your account
3. **Select:** fishtrack-sa site
4. **Deploys tab** → Find previous deploy (March 21)
5. **Click:** "Publish deploy"
6. **Done!** Rollback in 30 seconds

---

### Option 3: Revert Merge Commit

```bash
cd ~/.openclaw/workspace/fishtrack-sa

# Find the merge commit
git log main --oneline -5

# Revert the merge (creates new commit that undoes it)
git revert -m 1 <merge-commit-hash>
git push origin main
```

**This keeps history clean** (no force push)

---

## What Gets Rolled Back:

All features deployed today:
- ✅ Edit mode fixes
- ✅ Navigate to Spot feature
- ✅ Smart image display
- ✅ Version checking system
- ✅ Interactive feature cards
- ✅ Mobile popup fixes
- ✅ Logo optimization

**Rolling back = March 21 version (basic catch logger)**

---

## Testing After Rollback:

1. Visit: https://fishtrack-sa.netlify.app
2. Check: Logo loads
3. Check: Can log catch
4. Check: Map shows catches
5. **If OK:** Crisis averted, fix dev branch before re-deploying

---

## Prevention Next Time:

- Deploy during low-traffic hours (early morning)
- Test staging thoroughly first
- Deploy on Friday = bad (can't fix over weekend)
- Deploy on Monday = good (can monitor all week)

---

## Contact:

**If rollback doesn't work:**
- Check Netlify deploy logs
- Check browser console for errors
- Message me with error details

---

**Remember:** Rolling back is NORMAL. Better to rollback than leave broken site live.
