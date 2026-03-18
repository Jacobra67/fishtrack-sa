# FishTrack Africa - Fishing Data Platform

Real-time fishing data for African anglers. Starting with South Africa and Namibia. See where fish are biting right now.

## Features (MVP v0.1)

✅ **Landing Page**
- Beautiful hero section
- Live stats (catches this week, today's hotspot)
- Feature highlights
- Clear CTAs

✅ **Catch Logger**
- Photo upload with camera access
- Simple form (species, weight, location, bait)
- Privacy controls (Public/Friends/Private)
- GPS auto-capture
- Saves to Firebase Firestore

✅ **Interactive Map**
- Leaflet.js + OpenStreetMap
- Markers for each catch (color-coded by species)
- Click marker to see catch details
- Filters (species, date range)
- Real-time updates
- Legend

✅ **PWA Support**
- Installable as mobile app
- Fast loading
- Mobile-first design

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Database:** Firebase Firestore
- **Maps:** Leaflet.js + OpenStreetMap
- **Hosting:** Netlify (ready to deploy)

## Firebase Configuration

Already configured with project: `fishtrack-sa`
- Auth domain: fishtrack-sa.firebaseapp.com
- Project ID: fishtrack-sa

## Local Development

1. Open `index.html` in a browser
2. Or use a local server:
   ```bash
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

## Deployment (Netlify)

1. Push to GitHub (repo: `Jacobra67/fishtrack-sa`)
2. Connect Netlify to GitHub repo
3. Deploy settings:
   - Build command: (none)
   - Publish directory: `.` (root)
4. Auto-deploy on push

## File Structure

```
fishtrack-sa/
├── index.html              # Landing page
├── log-catch.html          # Catch logger
├── map.html                # Map view
├── css/
│   ├── style.css          # Global styles
│   ├── logger.css         # Catch logger styles
│   └── map.css            # Map page styles
├── js/
│   ├── firebase-config.js # Firebase initialization
│   ├── stats.js           # Live stats on landing page
│   ├── catch-logger.js    # Catch form logic
│   └── map.js             # Map + markers logic
├── manifest.json          # PWA manifest
└── README.md
```

## Features Roadmap

### Phase 2 (Weeks 3-4)
- User authentication (Firebase Auth)
- User profiles
- Friends system
- Edit/delete catches

### Phase 3 (Weeks 5-6)
- Tide/wind API integration
- Weather data
- Spot recommendations

### Phase 4 (Weeks 7-8)
- Fishing clubs
- Leaderboards
- Tournaments
- Monthly winners

### Phase 5 (Weeks 9+)
- Premium features
- Advanced analytics
- Push notifications
- Native mobile app (React Native)

## Browser Support

- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support
- Firefox: ✅ Full support
- Mobile browsers: ✅ Optimized

## Performance

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: 90+

## License

© 2026 FishTrack SA. All rights reserved.

## Contact

Built for South African anglers, by South African anglers 🇿🇦
