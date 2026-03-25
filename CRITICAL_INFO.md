# 🔐 FishTrack SA - Critical Information
**Keep this safe - you'll need it if things break**

---

## 🔑 Account Access

### GitHub (Code Repository)
- **URL:** https://github.com/Jacobra67/fishtrack-sa
- **Username:** Jacobra67
- **Email:** jacobusblake@gmail.com
- **2FA:** Check your phone/email for codes
- **Recovery:** Email reset link to jacobusblake@gmail.com

### Netlify (Hosting)
- **URL:** https://app.netlify.com/sites/fishtrack-sa
- **Login:** OAuth via GitHub (click "Login with GitHub")
- **Site URL:** https://fishtrack-sa.netlify.app
- **Deploy branch:** main (production), dev (testing)

### Firebase (Database)
- **Console:** https://console.firebase.google.com/project/fishtrack-sa
- **Login:** jacobusblake@gmail.com (Google account)
- **Project ID:** fishtrack-sa
- **Database:** Firestore (collection: "catches")

### Facebook Page
- **URL:** https://www.facebook.com/profile.php?id=61577122321255
- **Name:** FishTrack Africa
- **Admin:** Your personal Facebook account
- **Access:** facebook.com → Pages → FishTrack Africa

---

## 📊 Service Limits (Free Tiers)

### Netlify
- **Bandwidth:** 100 GB/month
- **Build minutes:** 300/month
- **Sites:** 500 (you have 1)
- **Current usage:** Check at app.netlify.com/teams/jacobra67/bandwidth

### Firebase (Spark Plan - Free)
- **Reads:** 50,000/day
- **Writes:** 20,000/day
- **Storage:** 1 GB
- **Bandwidth:** 10 GB/month
- **Current usage:** Check Firebase console → Usage tab

### GitHub (Free)
- **Repos:** Unlimited public repos
- **Storage:** Unlimited for code
- **Actions:** 2,000 minutes/month (we don't use this)

---

## 🔗 Important URLs (Bookmark These)

### Production
- **Live Site:** https://fishtrack-sa.netlify.app
- **Admin Panel:** https://fishtrack-sa.netlify.app/admin.html

### Dashboards
- **Netlify Deploys:** https://app.netlify.com/sites/fishtrack-sa/deploys
- **Firebase Console:** https://console.firebase.google.com/project/fishtrack-sa
- **GitHub Repo:** https://github.com/Jacobra67/fishtrack-sa

### Tools
- **Cover Photo Generator:** https://fishtrack-sa.netlify.app/facebook-cover-generator.html
- **Speed Test:** https://pagespeed.web.dev/analysis?url=https://fishtrack-sa.netlify.app

---

## 🆘 Emergency Contacts

### If Site Goes Down
1. **Bob (OpenClaw)** - WhatsApp message (fastest)
2. **Netlify Support:** https://www.netlify.com/support/
3. **Firebase Support:** https://firebase.google.com/support

### If Locked Out of Accounts
- **GitHub:** Password reset via jacobusblake@gmail.com
- **Firebase:** Password reset via Google account
- **Netlify:** Login via GitHub (can't be locked out if GitHub works)

### If Bob is Offline
- **Check OPERATIONAL_CHECKLIST.md** for manual diagnostics
- **Rollback guide:** See ROLLBACK.md
- **Post in OpenClaw Discord:** Community can help

---

## 🔒 Firebase Security Rules

**Current rules (should NOT be changed without testing):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /catches/{catchId} {
      // Anyone can read public/secret catches
      allow read: if resource.data.privacy in ['public', 'secret'];
      
      // Device owner can read their own private catches
      allow read: if resource.data.privacy == 'private' 
                  && resource.data.deviceId == request.auth.token.deviceId;
      
      // Anyone can create catches
      allow create: if request.resource.data.keys().hasAll(['species', 'weight', 'timestamp']);
      
      // Device owner can update/delete their own catches
      allow update, delete: if resource.data.deviceId == request.auth.token.deviceId;
    }
  }
}
```

**⚠️ WARNING:** If these rules break, catches will stop saving. Test in Firebase Console before applying changes.

---

## 💾 Backup Strategy

### Code Backups
- **Main branch:** Production code (always deployable)
- **Dev branch:** Testing code (may have bugs)
- **stable-backup branch:** Monthly snapshot (emergency rollback)

### Database Backups
- **Firebase auto-backup:** Not enabled on free tier
- **Manual export:** Firebase Console → Firestore → Import/Export
- **Recommendation:** Export catches monthly to local JSON file

### Weekly Manual Backup (5 minutes):
```bash
# Export catches from Firebase Console
1. Go to https://console.firebase.google.com/project/fishtrack-sa/firestore
2. Click "Export" button
3. Select "catches" collection
4. Download JSON file
5. Store in Google Drive or local backup
```

---

## 🛠️ Critical Files (DO NOT DELETE)

### Config Files
- **`firebase-config.js`** - Database connection (API keys inside)
- **`sw.js`** - Service worker (PWA functionality)
- **`version.txt`** - Update detection (triggers refresh banner)
- **`manifest.json`** - PWA config (app name, icons)

### Core Files
- **`index.html`** - Homepage
- **`log-catch.html`** - Catch logger (main feature)
- **`map.html`** - Interactive map (main feature)
- **`my-logbook.html`** - Personal logbook

### Important Directories
- **`js/`** - All JavaScript logic
- **`css/`** - All styling
- **`assets/`** - Logo, icons, images

---

## 📈 Growth Milestones (Track Progress)

### User Growth
- [ ] 10 catches logged
- [ ] 25 catches logged
- [ ] 50 catches logged
- [ ] 100 catches logged 🎉
- [ ] 10 active anglers
- [ ] 50 active anglers

### Platform Growth
- [ ] 50 Facebook followers
- [ ] 100 Facebook followers
- [ ] First influencer partnership
- [ ] Featured in fishing publication
- [ ] 1000+ site visits/month

### Technical Milestones
- [ ] 99%+ uptime for 1 month
- [ ] Zero critical bugs for 1 month
- [ ] Sub-2s page load time
- [ ] 10+ fishing spots on map
- [ ] 5+ different species logged

---

## 💰 Upgrade Triggers (When to Pay for Services)

### Netlify (Upgrade to $19/month if...)
- Bandwidth >80 GB/month consistently
- Need custom domain (fishtrack.africa)
- Need password protection for dev site

### Firebase (Upgrade to Blaze - Pay as you go if...)
- Daily reads >40K consistently
- Need scheduled functions (cleanup old data)
- Storage >800 MB
- **Estimate cost:** R50-200/month depending on usage

### When to Upgrade: **Not yet!** Wait until you hit 80% of free limits consistently for 2+ weeks.

---

## 📱 Bob's Contact Methods

### OpenClaw
- **WhatsApp:** Active 24/7 (this chat)
- **Response time:** <5 minutes usually
- **Best for:** Emergencies, quick questions, urgent fixes

### Commands
- "Bob, check FishTrack health" - Run health check now
- "Bob, show Firebase usage" - Check quota
- "Bob, rollback to yesterday" - Emergency rollback
- "Bob, help!" - This is broken, fix it!

---

**Last Updated:** 2026-03-25  
**Print this page or save to Google Drive for emergency access**
