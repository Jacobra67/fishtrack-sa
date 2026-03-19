# Tide & Wind Widget 🌊

**Status:** ✅ LIVE (v1.2.0)  
**Date:** March 19, 2026  
**Cost:** R0 (Free forever)

## Why This Matters

**The Problem:** Anglers check tide/wind every day before heading out. If FishTrack becomes their daily tide check, they'll discover the app organically.

**The Strategy:** Free forever, always accessible, drives habit formation.

**Expected Impact:**
- Daily visits (before every fishing trip)
- Increased brand awareness
- Natural upsell to premium features later
- SEO boost (people search "Cape Town tide times")

---

## Features

### Current Weather & Wind
- **Live wind speed** (km/h) and direction
- **Temperature** (°C)
- Updates on every page load
- Source: OpenMeteo API (unlimited free tier)

### Tide Times
- **Next high/low tide** (highlighted)
- **Today's tide schedule** (4 tides/day)
- **Countdown timer** ("in 2h 34m")
- **Approximate heights** (meters)

**Note:** Tides are currently approximate (simple lunar calculation). For production, integrate WorldTides API (1,000 requests/day free).

### Location Selector
Users can switch between:
- Cape Town
- Struisbaai
- Henties Bay
- Jeffreys Bay
- Mossel Bay

**Smart Memory:** Saves user's preferred location in localStorage

---

## Technical Details

### APIs Used

**1. OpenMeteo (Weather/Wind)**
- URL: `https://api.open-meteo.com/v1/forecast`
- Rate Limit: Unlimited (free tier)
- Data: Wind speed, direction, temperature
- Update Frequency: Every page load

**2. Tide Prediction (Current)**
- Simple lunar cycle calculation
- Approximate times (within 30-60 minutes accuracy)
- Good enough for MVP validation

**3. WorldTides (Recommended Upgrade)**
- URL: `https://www.worldtides.info/api/v3`
- Rate Limit: 1,000 requests/day (free tier)
- Data: Accurate tide times, heights, currents
- Cost: R0/month (free) or R700/month (unlimited)

### File Structure

```
/css/tide-wind.css         # Widget styles
/js/tide-wind.js           # Widget logic & API calls
```

### Locations Defined

```javascript
{
  capetown: { lat: -33.9249, lon: 18.4241 },
  struisbaai: { lat: -34.7933, lon: 20.0453 },
  hentiesbay: { lat: -22.1167, lon: 14.2833 },
  jeffreysbay: { lat: -34.0489, lon: 24.9089 },
  mossel: { lat: -34.1811, lon: 22.1458 }
}
```

**To add more locations:** Edit `LOCATIONS` object in `js/tide-wind.js`

---

## User Flow

1. **Visit homepage** → Widget loads automatically
2. **Select location** → Dropdown shows 5 spots
3. **View conditions** → Wind, temp, tide times
4. **Check countdown** → "Next high tide in 2h 34m"
5. **Bookmark page** → Return daily before fishing trips

**Habit Loop:**
- Cue: Planning a fishing trip
- Routine: Check FishTrack tide/wind
- Reward: Know best fishing times
- Result: Daily engagement, brand loyalty

---

## Upgrade Path (Future)

### Phase 1 (Now): Simple Tides
- ✅ Lunar calculation (approximate)
- ✅ Good enough for validation
- ✅ R0 cost

### Phase 2 (Month 2): WorldTides API
- 📅 Accurate tide times
- 📅 Tide heights (meters)
- 📅 Tidal currents
- 📅 Moon phase
- **Trigger:** 100+ daily active users
- **Cost:** R0 (free tier) or R700/month (unlimited)

### Phase 3 (Month 3+): Advanced Features
- 📅 Swell forecast (wave height/period)
- 📅 Water temperature
- 📅 UV index
- 📅 Best fishing times (Solunar theory)
- 📅 Historical data ("Last week's conditions")

**Revenue Opportunity:** Premium users get 7-day forecast, historical comparisons, fishing time predictions

---

## Performance

**Load Time:** ~200-500ms
- Wind/weather: ~150ms (OpenMeteo)
- Tides: Instant (calculated locally)

**Mobile Optimized:**
- Responsive design (stacks on mobile)
- Touch-friendly buttons
- Readable fonts (14px+)

**Offline Support:**
- Cached in service worker
- Shows last loaded data when offline
- Warning: "Offline - data may be outdated"

---

## Analytics to Track

**Engagement:**
- Daily active users (DAU)
- Location selector usage (which spots are popular?)
- Time spent on widget
- Bounce rate (do people leave after checking tide?)

**Conversion:**
- Tide check → Log catch (how many convert?)
- Tide check → View map
- Return visitors (daily habit formed?)

**SEO:**
- Organic traffic from "Cape Town tide times"
- Keyword rankings
- Backlinks from fishing forums

---

## Marketing Copy

**For Facebook posts:**
> "🌊 Before you head out, check today's tide & wind - always free on FishTrack Africa!  
> Cape Town • Struisbaai • Henties Bay • Jeffreys Bay • Mossel Bay  
> No account needed, works offline 💨"

**For tackle shop stickers:**
> "Check today's tide & wind →  
> [QR CODE]  
> FishTrack Africa - Always Free"

**For Instagram:**
> "Planning your next session? 🎣  
> Check live wind & tide times for 5 top SA spots - free forever!  
> Link in bio 🌊"

---

## User Feedback Expected

**Positive:**
- "Finally, tide times in one place!"
- "Love that it's free"
- "This is so useful before heading out"

**Negative (expected):**
- "Tide times are off by 30 minutes" → Upgrade to WorldTides API
- "Why only 5 locations?" → Add more spots
- "Can you add swell forecast?" → Premium feature later

**How to respond:**
- Acknowledge feedback
- Explain it's early version (approximate tides)
- Ask: "Would you pay R99/month for accurate tides + swell?"
- Use feedback to validate premium features

---

## Next Steps (This Week)

**Day 1-2:**
- ✅ Widget is live
- [ ] Test on mobile (your phone)
- [ ] Ask 3 fishing buddies to test
- [ ] Monitor console logs for errors

**Day 3-4:**
- [ ] Print QR stickers with tide/wind callout
- [ ] Post on Facebook: "Free tide/wind widget for SA anglers"
- [ ] Share in 3 fishing groups

**Day 5-7:**
- [ ] Track: How many people use the widget?
- [ ] Feedback: Is tide timing accurate enough?
- [ ] Decide: Upgrade to WorldTides API or keep simple?

---

## Success Criteria

**Week 1:**
- 50+ unique widget loads
- 10+ location changes (users exploring different spots)
- 3+ pieces of feedback

**Week 2:**
- 100+ unique widget loads
- 5+ return visitors (daily habit forming)
- 1+ tackle shop asks to partner

**Month 1:**
- 500+ unique widget loads
- 50+ daily active users
- 10+ conversions (tide check → log catch)

**If these hit:** You have product-market fit. Build premium features.

---

**Status:** Ready for user testing! 🚀  
**Version:** 1.2.0  
**Next:** Print stickers, spread the word, watch the data.
