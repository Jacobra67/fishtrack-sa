# FishTrack SA - MVP Build Instructions

Build a beautiful, mobile-first fishing data platform for South Africa.

## Core Features

1. **Landing Page (index.html)**
   - Hero: "Where are they biting? Find out. Right now."
   - Live stats from Firebase (catches this week, today's hotspot)
   - Big green CTA: "Log Your Catch"
   - Mobile-responsive, fast loading

2. **Catch Logger (log-catch.html)**
   - Photo upload (camera access)
   - Simple form: species, weight, location, bait
   - Privacy: Public/Friends/Private
   - GPS auto-capture
   - Submit saves to Firebase

3. **Map View (map.html)**
   - Leaflet.js + OpenStreetMap
   - Markers for each catch (colored by species)
   - Click marker → see catch details
   - Filters: species, date, location

## Tech Stack
- HTML + CSS + Vanilla JS (no frameworks)
- Firebase Firestore (database)
- Leaflet.js (maps)
- Mobile-first design

## Firebase Config
```javascript
{
  apiKey: "AIzaSyBu8k_4z-R8GDCZfqHa2K-kfkwjxA_qH8",
  authDomain: "fishtrack-sa.firebaseapp.com",
  projectId: "fishtrack-sa",
  storageBucket: "fishtrack-sa.firebasestorage.app",
  messagingSenderId: "610455904803",
  appId: "1:610455904803:web:3f04f72c5bd9644c64d336"
}
```

## Design
- Colors: Ocean Blue (#0077be), Sandy Beige (#f4e4c1), Green (#2ecc71)
- Fast loading (<3s)
- Screenshot-worthy UI
- Touch-friendly (44px min button height)

## File Structure
```
/
├── index.html
├── log-catch.html
├── map.html
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── catch-logger.js
│   └── map.js
└── manifest.json
```

Make it beautiful, fast, and shareable. This is the first impression.
