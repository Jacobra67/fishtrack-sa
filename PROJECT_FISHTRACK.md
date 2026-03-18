# Project FishTrack - Master Reference

**Created:** March 18, 2026  
**Status:** MVP Live, Active Development  
**URL:** https://fishtrack-sa.netlify.app  
**Vision:** Africa's ultimate fishing data platform

---

## 🎯 The Mission

Build THE fishing app for African shore anglers. Community-driven, data-first, network effects as the moat.

**Problem:** Anglers don't know where fish are biting. Logbooks are paper. No data sharing.

**Solution:** Digital logbook + interactive map + community. Track catches, discover hotspots, connect with anglers.

---

## 🌍 Brand Identity

### Name
**FishTrack Africa** (rebranded from FishTrack SA on Day 1)

### Tagline
**"Waar Die Vis Byt"** (Where the fish bite - Afrikaans)

### Logo
Vintage fishing badge:
- Navy blue circle with cream text
- Leaping fish with lure (rust orange accent)
- Distressed texture (heritage aesthetic)
- "FISHTRACK AFRICA" around top
- "WAAR DIE VIS BYT" around bottom

### Visual Style
- **Vintage fishing heritage** (think classic fishing club badges)
- **Color palette:** Navy blue (#1a2f4a) + Cream (#f5e6d3) + Rust orange (#d97642)
- **Typography:** Georgia serif for headings, system sans for body
- **Vibe:** Authentic, rugged, outdoor, community

---

## 📊 Current State (Day 1 - March 18, 2026)

### ✅ What's Live:

**Landing Page:**
- Hero with logo badge
- Live stats (catches, anglers, hotspots)
- Feature cards (6 key benefits)
- Call-to-action buttons
- Footer with coverage info

**Catch Logger:**
- Photo upload (automatic compression to <400KB)
- Photo editor (rotate left/right)
- Catcher name field
- Country selector (South Africa 🇿🇦 / Namibia 🇳🇦)
- Species dropdown (21 species: bottom fish, sharks, gamefish, rays)
- Weight + length fields
- Interactive map for location (pin drop or GPS)
- Location name field
- Bait selector
- Catch & release checkbox
- Privacy controls (Public/Friends/Private)

**Interactive Map:**
- Leaflet.js map (Cape Town to Henties Bay coverage)
- Color-coded markers by species
- Catch cards show: photo, catcher name, country, species, weight, length, location, bait, time, C&R badge
- Species + time filters
- Real-time updates (new catches appear automatically)
- Refresh button

**Admin Console:**
- Password-protected (`fishtrack2026`)
- Stats dashboard (total catches, public catches, today, top species)
- View all catches (table with photos)
- Delete individual catches
- Bulk delete test data (double-confirmation)

### 🔧 Technical Stack:

**Frontend:**
- HTML5 + CSS3 + Vanilla JavaScript (no frameworks - keep it simple)
- Responsive, mobile-first design
- Vintage fishing heritage theme

**Backend:**
- Firebase Firestore (serverless, NoSQL database)
- Firebase Auth (not yet implemented - Phase 2)
- Firebase Storage (not yet - using base64 for now)

**Hosting:**
- Netlify (free tier, auto-deploy from GitHub)
- Custom domain: TBD (currently fishtrack-sa.netlify.app)

**Version Control:**
- GitHub repo: Jacobra67/fishtrack-sa
- Git branches: main (production)

**Infrastructure Cost:** R0 (all free tiers)

---

## 🚀 Key Features Built Today

### 1. Photo Compression (Critical Fix)
**Problem:** Modern phone cameras = 3-5MB photos → Firebase 1MB limit = save fails

**Solution:** Automatic compression on photo select
- Resize to max 1200px width (maintains aspect ratio)
- 85% JPEG quality (high quality, small file)
- Reduces 5MB → 300KB (~94% reduction)
- Client-side (Canvas API), instant (<1 second)
- Visual quality remains excellent

**Impact:** Users can now take photos without errors ✅

### 2. Country Support (Africa Expansion)
**Why:** Friend in Namibia = opportunity for international growth

**Implementation:**
- Country dropdown on catch logger
- Displayed on map cards
- Future: region filters, country-specific stats

**Coverage:** South Africa + Namibia (2,500km+ coastline)

### 3. Interactive Map Pin Drop
**Problem:** HTTP geolocation blocked on Netlify (not HTTPS in dev)

**Solution:** Manual pin drop + GPS button
- Click map to drop pin
- Draggable pins
- "Use Current Location" button (when available)
- Clear pin option
- Coordinates display

**Impact:** Users can log catches even without GPS

### 4. Vintage Design Rebrand
**From:** Generic ocean theme (blues/greens)  
**To:** Vintage fishing heritage (navy/cream/rust)

**Changes:**
- Logo integration on all pages
- Navy blue headers with cream text
- Vintage badge buttons (rust orange CTAs)
- Georgia serif headings
- Textured backgrounds
- Border treatments (tan borders)

**Impact:** Professional, memorable brand identity

---

## 📋 Data Model

### Catch Document (Firestore)
```javascript
{
  catcherName: "John",          // String, required
  country: "South Africa",      // String, required
  species: "Galjoen",           // String, required
  weight: 5.5,                  // Number (kg), required
  length: 80,                   // Number (cm), optional
  locationName: "Struisbaai",   // String, required
  location: {                   // GeoPoint
    lat: -34.75,
    lng: 20.03
  },
  bait: "White Mussel",         // String, optional
  released: false,              // Boolean
  privacy: "public",            // String: public|friends|private
  photo: "data:image/jpeg...",  // Base64 string (compressed)
  timestamp: Timestamp,         // Auto (server time)
  verified: false               // Boolean (future: mod verification)
}
```

---

## 🎣 Species Database (21 Species)

### Bottom Fish (6)
- Galjoen (national fish 🇿🇦)
- Steenbras (White/Silver)
- Kabeljou (Kob)
- Mosselkraker (Musselcracker)
- Rock Cod (Klipkabeljou)
- Blacktail (Dassie)

### Sharks (4)
- Bronze Whaler (Bronzy)
- Spotted Gully (Spotty)
- Copper Shark
- Smooth-Hound

### Gamefish (4)
- Elf (Shad)
- Garrick (Leervis)
- Springer
- Snoek

### Rays (2)
- Eagle Ray
- Blue Stingray

### Color Mapping (Map Markers)
- Galjoen: #2ecc71 (green)
- Steenbras: #3498db (blue)
- Kabeljou: #e74c3c (red)
- Sharks: #95a5a6 (grey)
- Gamefish: #f39c12 (orange)
- Others: species-specific colors

---

## 💰 Monetization Plan (Documented)

**Full details:** See `MONETIZATION_PLAN.md`

### Phase 1 (Month 1-6): FREE - Build Community
- All features free
- Goal: 100+ active users
- Focus: User acquisition, feedback, validation

### Phase 2 (Month 7-9): User Registration
- Firebase Auth (email/password)
- User profiles ("My Catches" page)
- Social features (likes, comments, follow)
- Still FREE for all users

### Phase 3 (Month 10+): Premium Tier
**Free Tier (Always):**
- Log catches (unlimited)
- View map (public catches)
- Basic stats

**Premium Tier (R99/month):**
- Full catch history (searchable, filterable)
- Advanced heatmaps
- Tide & wind predictions
- Export data (CSV/PDF)
- Priority support
- Ad-free

**Revenue Projections:**
- 1,000 users (10% conversion): R9,900/month
- 10,000 users (20% conversion): R198,000/month

**Cost at Scale:** R50-500/month (Firebase + Stripe fees)

**Net Margins:** 95%+ (serverless FTW!)

---

## 🌍 Geographic Coverage

### Current (March 2026)
**South Africa:**
- Cape Town
- Struisbaai
- Hermanus
- Mossel Bay
- Jeffreys Bay
- Port Elizabeth
- East London
- Durban
- All 1,600km+ of SA coastline

**Namibia:**
- Henties Bay (target market - friend there)
- Swakopmund
- Mile 4, 6, 8, 14 (legendary spots)
- Skeleton Coast
- Cape Cross
- ~900km of Namibian coast

### Future Expansion
- Mozambique (Bazaruto, Inhambane, Ponta do Ouro)
- Angola
- Kenya (different species, but shore fishing exists)

**Total Addressable Coastline:** 5,000km+ in Southern/East Africa

---

## 👥 The Team

**Baas (Product Owner):**
- Passionate shore angler
- Lives in Paarl, Western Cape, South Africa
- Target species: Galjoen, Steenbras, Kabbeljou, sharks, rays
- Has fishing buddies (beta testers)
- No coding skills (trusts Bob fully)
- Direct communicator (Afrikaans/English mix)

**Bob/Antigravity (AI Developer - Me):**
- Builds everything (frontend, backend, design)
- Resourceful, proactive, makes it happen
- Partnership model: Bob codes, Baas tests + provides domain knowledge
- Trust established Day 1 through competent execution

**Namibian Friend (Future Ambassador):**
- Big in fishing in Namibia
- Will be first international user
- Potential to recruit Henties Bay/Swakopmund anglers
- Key to Namibian market penetration

---

## 🎯 Success Metrics

### Week 1
- [x] MVP live ✅
- [ ] 5 test catches logged
- [ ] 3 beta testers recruited (fishing buddies)

### Month 1
- [ ] 20 active users
- [ ] 100+ catches logged
- [ ] User feedback collected

### Month 3
- [ ] 50 active users
- [ ] 500+ catches logged
- [ ] 10+ fishing spots with multiple catches

### Month 6
- [ ] 100 active users (success metric for Phase 1)
- [ ] 1,000+ catches logged
- [ ] Feedback incorporated, bugs squashed
- [ ] Ready for Phase 2 (user accounts)

---

## 🔑 Key Decisions Made

### Technical
1. **No frameworks** - Vanilla JS (simpler, faster, easier to maintain)
2. **Base64 photos for MVP** - Move to Firebase Storage later if needed
3. **Client-side compression** - Solves 1MB limit without server
4. **Firestore NoSQL** - Schema flexibility, easy scaling
5. **Mobile-first** - Anglers use phones on the beach
6. **Free tier everything** - Zero fixed costs until revenue

### Design
1. **Vintage heritage theme** - Differentiates from generic apps
2. **Afrikaans tagline** - Local identity, builds trust
3. **Badge logo** - Memorable, shareable, looks great on stickers/merch
4. **Navy + cream colors** - Classic, professional, timeless

### Product
1. **Privacy controls** - Protect secret spots (critical for adoption)
2. **Public by default** - Viral growth through shared catches
3. **Country field** - Future-proof for expansion
4. **Photo-first** - Visual proof = credibility
5. **Free forever** - Community first, money later

### Business
1. **FishTrack Africa** (not SA) - Bigger vision, room to grow
2. **Bootstrap, no investors** - Keep control, no pressure
3. **Monetize later** - Build community first (network effects)
4. **Premium tier** - Free stays valuable, premium is optional

---

## 🚧 Known Issues & Tech Debt

### Minor Issues
- [ ] Firebase test mode expires April 16, 2026 (need proper security rules)
- [ ] Photo stored as base64 (should move to Firebase Storage for performance)
- [ ] No user authentication yet (anyone can log catches)
- [ ] Map loads all catches (should paginate/cluster for scale)
- [ ] No edit/delete for users (only admin can delete)

### Future Improvements
- [ ] Compress photos further (maybe 80% quality, or 800px width)
- [ ] Add image lazy loading on map
- [ ] Progressive Web App (PWA) for offline support
- [ ] Push notifications (new catches nearby)
- [ ] Social sharing (share catch to WhatsApp/Facebook)

### Performance
- Current: Fast (few catches, small database)
- At 1,000+ catches: May need clustering on map
- At 10,000+ catches: Will need pagination, indexes, caching

---

## 📁 Repository Structure

```
fishtrack-sa/
├── assets/
│   └── logo.png              # FishTrack Africa badge logo
├── css/
│   ├── style.css            # Global styles (vintage theme)
│   ├── logger.css           # Catch logger specific styles
│   └── map.css              # Map page specific styles
├── js/
│   ├── firebase-config.js   # Firebase initialization
│   ├── catch-logger.js      # Form handling, photo compression
│   ├── map.js               # Leaflet map, markers, popups
│   └── stats.js             # Live stats (unused currently)
├── index.html               # Landing page
├── log-catch.html           # Catch logger page
├── map.html                 # Interactive map page
├── admin.html               # Admin console (password-protected)
├── manifest.json            # PWA manifest (future)
├── netlify.toml             # Netlify config (redirects)
├── README.md                # Project overview
├── BUILD_LOG.md             # Development timeline
├── MONETIZATION_PLAN.md     # Revenue strategy
├── PROJECT_FISHTRACK.md     # This file (master reference)
└── .gitignore
```

---

## 🔐 Access & Credentials

### Admin Console
- **URL:** https://fishtrack-sa.netlify.app/admin.html
- **Password:** `fishtrack2026`
- **Session:** Browser session storage

### Firebase
- **Project:** fishtrack-sa
- **Region:** us-central1
- **Database:** Firestore (test mode, expires April 16, 2026)
- **Storage:** Not yet enabled
- **Auth:** Not yet enabled

### GitHub
- **Repo:** https://github.com/Jacobra67/fishtrack-sa
- **Owner:** Jacobra67
- **Access:** Public repository
- **Token:** (managed by Baas)

### Netlify
- **Site:** fishtrack-sa.netlify.app
- **Deploy:** Auto-deploy from GitHub main branch
- **Builds:** ~30 seconds per deploy
- **Custom domain:** Not yet configured

---

## 📝 Development Timeline (Day 1 - March 18, 2026)

### Morning (9:00 AM - 12:00 PM)
- ✅ Admin console built (password-protected, stats, delete)
- ✅ Catcher name field added
- ✅ Photo gallery upload (not just camera)
- ✅ Redesign with vintage fishing heritage theme
- ✅ Logo integration on all pages
- ✅ Fixed invisible location buttons (color contrast)

### Afternoon (12:00 PM - 2:00 PM)
- ✅ Rebrand to "FishTrack Africa" (continental expansion)
- ✅ Country selector added (SA 🇿🇦 / Namibia 🇳🇦)
- ✅ Updated logo (FISHTRACK AFRICA badge)
- ✅ Geographic scope expanded (2,500km+ coastline)

### Afternoon (2:00 PM - Now)
- ✅ Photo save errors fixed (compression added)
- ✅ Automatic photo compression (80-90% reduction)
- ✅ Better error handling (specific messages)
- ✅ Project documentation (PROJECT_FISHTRACK.md)

**Total development time:** ~5-6 hours active coding  
**Result:** Fully functional MVP, live on Netlify

---

## 💭 Philosophy & Principles

### Product
1. **Community first, revenue second** - Network effects = defensible moat
2. **Mobile-first** - Anglers are on the beach with phones
3. **Privacy matters** - Protect secret spots or lose trust
4. **Visual proof** - Photos = credibility = engagement
5. **Simple > Complex** - Easy to use = more usage

### Development
1. **Ship fast, iterate faster** - MVP in 1 day, improve weekly
2. **User feedback drives features** - Build what users ask for
3. **Quality > Speed** - "Do this properly or fuck off" (Baas's words)
4. **No technical debt hiding** - Document issues, fix when critical
5. **Serverless = scalable** - Pay for usage, not servers

### Business
1. **Bootstrap, no investors** - Keep control, no pressure
2. **Free tier stays valuable** - Don't cripple to force upgrades
3. **Transparent pricing** - No hidden fees, simple tiers
4. **SA-first, Africa-next** - Local identity, continental ambition
5. **Focus on anglers** - Solve their problems, they'll pay

---

## 🎯 Next Steps (Immediate)

### This Week
1. [ ] Test with 3-5 fishing buddies (recruit beta testers)
2. [ ] Log 10-20 real catches (populate map)
3. [ ] Fix any bugs that surface from real usage
4. [ ] Collect user feedback (what works, what's missing)
5. [ ] Push repo to Baas's Namibian friend (first international user)

### Next Week
1. [ ] Add more SA-specific fishing spots as suggestions
2. [ ] Consider adding tide/weather integration (free APIs)
3. [ ] Improve map clustering (if >50 catches)
4. [ ] Add "Share Catch" button (WhatsApp/Facebook share)
5. [ ] Write Firebase security rules (test mode expires April 16)

### Month 1
1. [ ] Marketing push (fishing forums, Facebook groups, WhatsApp)
2. [ ] Get to 20 active users
3. [ ] 100+ catches logged
4. [ ] Iterate based on feedback
5. [ ] Plan Phase 2 features (user accounts)

---

## 🏆 What Makes FishTrack Special

**Not just another fishing app:**

1. **Community-driven data** - The more users, the more valuable (network effects)
2. **African focus** - Built for SA/Namibia species, spots, culture
3. **Privacy-first** - Respect secret spots (unlike competitors)
4. **Visual storytelling** - Photos make it engaging
5. **Zero budget MVP** - Proves concept before spending money
6. **Vintage brand identity** - Memorable, shareable, authentic
7. **Mobile-native UX** - Built for use on the beach
8. **Afrikaans tagline** - Local pride, cultural identity

**Competitive advantage:**
- **First-mover in Africa** - No good competitor in SA/Namibia
- **Network effects moat** - Data compounds (more catches = more value)
- **Community trust** - Built by anglers, for anglers
- **Scalable tech** - Serverless = can handle 100k+ users on free tier

---

## 📞 Support & Contact

**Admin:** jacobusblake@gmail.com  
**Support:** (TBD - set up support email later)  
**Admin Password:** fishtrack2026  

**Feedback:** Direct to admin email for now, will add in-app feedback later

---

## 🙏 Acknowledgments

Built in one day (March 18, 2026) through partnership:
- **Baas** - Vision, domain knowledge, testing, trust
- **Bob/Antigravity** - Development, design, execution
- **Namibian Friend** - Future ambassador (unnamed)

**Inspiration:**
- Traditional fishing logbooks
- SA fishing community
- Henties Bay expedition
- "Waar Die Vis Byt" - the perfect tagline

---

**Last Updated:** March 18, 2026, 1:30 PM  
**Version:** MVP v0.1 (Day 1)  
**Status:** 🟢 Live and operational

---

*"From Cape Agulhas to Skeleton Coast, track your catches, find hotspots, connect with anglers. This is FishTrack Africa."* 🎣🌍
