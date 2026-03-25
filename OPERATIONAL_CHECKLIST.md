# 🚢 FishTrack SA - Operational Checklist
**Keep This Ship Sailing - Daily/Weekly/Monthly Tasks**

---

## 🔴 CRITICAL - Check Daily (or when issues reported)

### 1. Site is Live
- **URL:** https://fishtrack-sa.netlify.app
- **Quick test:** Open site, can you see catches on map?
- **Expected:** Site loads in <3 seconds, map shows pins

**If DOWN:**
- Check Netlify dashboard: https://app.netlify.com/sites/fishtrack-sa/deploys
- Look for failed deploy (red X)
- Check Discord/WhatsApp for user reports

### 2. Catches Are Being Logged
- **Check:** Visit https://fishtrack-sa.netlify.app/map.html
- **Expected:** New catches appearing (timestamps show recent activity)
- **If NO new catches for 48+ hours:** Might be slow period OR logging broken

**Test yourself:**
- Log a test catch
- Check if it appears on map within 10 seconds
- Delete test catch from Firebase (admin.html)

### 3. Firebase Connection Working
- **Check:** Map loads without "Error loading catches" message
- **Firebase Console:** https://console.firebase.google.com/project/fishtrack-sa
- **Expected:** No errors in Firebase console, quota not exceeded

**If FIREBASE ERROR:**
- Check Firestore quota (free tier = 50K reads/day, 20K writes/day)
- Check authentication working
- Verify API keys in firebase-config.js not expired

---

## 🟡 IMPORTANT - Check Weekly

### 1. Free Tier Quotas Not Exceeded

#### Netlify (Hosting)
- **Dashboard:** https://app.netlify.com/teams/jacobra67/bandwidth
- **Free tier limits:**
  - 100 GB bandwidth/month
  - 300 build minutes/month
- **Check:** Are you at >80% of either?
- **If YES:** Traffic is growing! Consider upgrading or optimizing images

#### Firebase (Database)
- **Dashboard:** https://console.firebase.google.com/project/fishtrack-sa/usage
- **Free tier limits:**
  - 50K reads/day
  - 20K writes/day
  - 1 GB storage
- **Check:** Daily usage trends
- **If approaching limits:** 
  - Add pagination to map (load catches in batches)
  - Cache more aggressively
  - Consider Firebase Blaze plan (pay-as-you-go, still cheap)

### 2. GitHub Repo Health
- **Repo:** https://github.com/Jacobra67/fishtrack-sa
- **Check:** 
  - Recent commits pushed successfully?
  - No open security alerts?
  - Backup still exists? (stable-backup branch)

### 3. PWA Update System Working
- **Test:** Make a small change, push to GitHub
- **Expected:** Site auto-updates within 2 minutes (Netlify build + deploy)
- **Check:** Users see update banner within 30 seconds

---

## 🟢 ROUTINE - Check Monthly

### 1. Performance Audit
- **Tool:** https://pagespeed.web.dev/
- **Test URL:** https://fishtrack-sa.netlify.app
- **Expected:** 
  - Mobile score: >80
  - Desktop score: >90
- **If LOW:** Check for:
  - Oversized images in catches
  - Slow Firebase queries
  - JavaScript errors in console

### 2. User Feedback Review
- **Check:**
  - WhatsApp messages about bugs
  - Facebook page comments
  - Influencer feedback
- **Track:** Common complaints = prioritize fixes

### 3. Backup Verification
- **Check:** stable-backup branch exists
- **Last updated:** Within 30 days?
- **Create fresh backup:**
  ```bash
  cd ~/.openclaw/workspace/fishtrack-sa
  git checkout main
  git branch -D stable-backup
  git checkout -b stable-backup
  git push origin stable-backup --force
  git checkout main
  ```

### 4. Security Updates
- **Check for:** 
  - Outdated dependencies (Firebase, Leaflet)
  - Security alerts in GitHub
  - Firebase security rules still tight

---

## 🚨 EMERGENCY - If Site Goes Down

### Step 1: Diagnose
1. **Is it DNS/hosting?** → Check Netlify status page
2. **Is it Firebase?** → Check Firebase console for errors
3. **Is it code?** → Check latest deploy in Netlify

### Step 2: Quick Fixes
- **If bad deploy:** Rollback in Netlify (click previous deploy → "Publish deploy")
- **If Firebase quota exceeded:** Wait for reset (24h) OR upgrade to Blaze plan
- **If GitHub issue:** Push rollback commit

### Step 3: Rollback to Last Known Good
```bash
cd ~/.openclaw/workspace/fishtrack-sa
git checkout stable-backup
git checkout -b emergency-rollback
git push origin emergency-rollback
# Point Netlify to emergency-rollback branch temporarily
```

### Step 4: Notify Users
- Post on Facebook page: "Experiencing technical issues, fixing now"
- Update when resolved: "All systems back online!"

---

## 📊 Key Metrics to Track

### Growth Metrics (Good News!)
- **Total catches:** Check map daily
- **Active users:** Unique catcher names in last 7 days
- **Facebook followers:** Growing?
- **Geographic spread:** Catches in new locations?

### Health Metrics (Watch These!)
- **Page load time:** <3 seconds (test on mobile data)
- **Error rate:** Check browser console for JS errors
- **Uptime:** Should be 99.9%+ (check Netlify)

---

## 🛠️ Tools You Need Access To

### Essential (Check Now!)
- ✅ **GitHub:** github.com/Jacobra67 (logged in?)
- ✅ **Netlify:** app.netlify.com (can access fishtrack-sa site?)
- ✅ **Firebase:** console.firebase.google.com (can see fishtrack-sa project?)
- ✅ **Facebook:** facebook.com/profile.php?id=61577122321255 (page admin?)

### Nice to Have
- **Google Analytics** (future): Track visitors
- **Uptime monitoring** (future): UptimeRobot.com (free)

---

## 🤖 Bob's Monitoring (Automated)

**I can help with:**
1. Daily site health check (cron job)
2. Alert you if site is down
3. Check Firebase quotas weekly
4. Remind you of monthly tasks

**Want me to set up automated monitoring?** I can:
- Ping the site every 30 minutes
- Check Firebase usage daily
- Alert you via WhatsApp if anything breaks

---

## 📞 Quick Contact Info

### When Something Breaks
1. **Message Bob** (OpenClaw) - fastest response
2. **Check Netlify support:** docs.netlify.com
3. **Firebase support:** firebase.google.com/support

### Account Recovery
- **GitHub password:** Reset via jacobusblake@gmail.com
- **Firebase:** Same Google account
- **Netlify:** OAuth via GitHub (no separate password)

---

## ✅ Weekly 5-Minute Check

**Every Sunday evening (or Monday morning):**

```
[ ] Open https://fishtrack-sa.netlify.app - loads fast?
[ ] Map shows catches? (at least 1 this week?)
[ ] Log a test catch - works?
[ ] Check Netlify bandwidth - under 80 GB?
[ ] Check Firebase quota - under 40K reads/day?
[ ] Facebook page - any urgent messages?
[ ] Everything good? ✅ Ship keeps sailing! 🚢
```

---

**Last Updated:** 2026-03-25  
**Version:** v1.0  
**Status:** 🟢 ALL SYSTEMS GO
