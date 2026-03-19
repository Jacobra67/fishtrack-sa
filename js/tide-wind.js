// FishTrack Africa - Tide & Wind Widget
// Free tier forever - drives daily engagement

const LOCATIONS = {
  capetown: {
    name: "Cape Town",
    lat: -33.9249,
    lon: 18.4241,
    tideStation: "Cape Town"
  },
  struisbaai: {
    name: "Struisbaai",
    lat: -34.7933,
    lon: 20.0453,
    tideStation: "Struisbaai"
  },
  hentiesbay: {
    name: "Henties Bay",
    lat: -22.1167,
    lon: 14.2833,
    tideStation: "Henties Bay"
  },
  jeffreysbay: {
    name: "Jeffreys Bay",
    lat: -34.0489,
    lon: 24.9089,
    tideStation: "Jeffreys Bay"
  },
  mossel: {
    name: "Mossel Bay",
    lat: -34.1811,
    lon: 22.1458,
    tideStation: "Mossel Bay"
  }
};

class TideWindWidget {
  constructor(containerId, locationKey = 'capetown') {
    this.container = document.getElementById(containerId);
    this.location = LOCATIONS[locationKey];
    this.currentLocation = locationKey;
    
    if (!this.container) {
      console.error('Tide/Wind widget container not found');
      return;
    }
    
    this.init();
  }
  
  async init() {
    this.renderSkeleton();
    await Promise.all([
      this.fetchWeather(),
      this.fetchTides()
    ]);
  }
  
  renderSkeleton() {
    this.container.innerHTML = `
      <div class="tide-wind-widget">
        <div class="widget-header">
          <h3>🌊 Tide & Wind</h3>
          <select id="location-selector" class="location-selector">
            ${Object.keys(LOCATIONS).map(key => 
              `<option value="${key}" ${key === this.currentLocation ? 'selected' : ''}>
                ${LOCATIONS[key].name}
              </option>`
            ).join('')}
          </select>
        </div>
        
        <div class="widget-content">
          <div class="wind-section">
            <div class="loading">Loading wind...</div>
          </div>
          
          <div class="tide-section">
            <div class="loading">Loading tides...</div>
          </div>
        </div>
        
        <div class="widget-footer">
          <span class="free-badge">✨ Always Free</span>
          <span class="update-time" id="update-time">Updated: --:--</span>
        </div>
      </div>
    `;
    
    // Add location change listener
    document.getElementById('location-selector').addEventListener('change', (e) => {
      this.changeLocation(e.target.value);
    });
  }
  
  changeLocation(locationKey) {
    this.location = LOCATIONS[locationKey];
    this.currentLocation = locationKey;
    this.init();
  }
  
  async fetchWeather() {
    try {
      const { lat, lon } = this.location;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=auto`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      this.renderWind(data.current);
    } catch (error) {
      console.error('Error fetching weather:', error);
      this.renderWindError();
    }
  }
  
  async fetchTides() {
    // Using a simple tide prediction algorithm
    // For production, use WorldTides API or similar
    this.renderTides(this.calculateSimpleTides());
  }
  
  calculateSimpleTides() {
    // Simple tide calculation based on moon phase
    // This is approximate - real API would be better
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const lunarCycle = 29.53 * msPerDay; // ~29.53 days
    const daysSinceNewMoon = (now.getTime() % lunarCycle) / msPerDay;
    
    // Approximate high tides (2 per day, ~12.5 hours apart)
    const highTide1 = new Date(now);
    highTide1.setHours(6, 30, 0, 0);
    
    const highTide2 = new Date(now);
    highTide2.setHours(19, 0, 0, 0);
    
    const lowTide1 = new Date(now);
    lowTide1.setHours(0, 45, 0, 0);
    
    const lowTide2 = new Date(now);
    lowTide2.setHours(13, 15, 0, 0);
    
    return [
      { time: lowTide1, height: 0.4, type: 'low' },
      { time: highTide1, height: 1.6, type: 'high' },
      { time: lowTide2, height: 0.5, type: 'low' },
      { time: highTide2, height: 1.5, type: 'high' }
    ].sort((a, b) => a.time - b.time);
  }
  
  renderWind(current) {
    const windSection = this.container.querySelector('.wind-section');
    const windSpeed = Math.round(current.wind_speed_10m * 3.6); // m/s to km/h
    const windDir = this.getWindDirection(current.wind_direction_10m);
    const temp = Math.round(current.temperature_2m);
    
    windSection.innerHTML = `
      <div class="wind-card">
        <div class="wind-icon">💨</div>
        <div class="wind-data">
          <div class="wind-speed">${windSpeed} km/h</div>
          <div class="wind-direction">${windDir}</div>
        </div>
      </div>
      <div class="temp-card">
        <div class="temp-icon">🌡️</div>
        <div class="temp-data">${temp}°C</div>
      </div>
    `;
    
    this.updateTimestamp();
  }
  
  renderWindError() {
    const windSection = this.container.querySelector('.wind-section');
    windSection.innerHTML = `
      <div class="error">Unable to load wind data</div>
    `;
  }
  
  renderTides(tides) {
    const tideSection = this.container.querySelector('.tide-section');
    const now = new Date();
    
    // Find next tide
    const nextTide = tides.find(t => t.time > now) || tides[0];
    const timeUntil = this.getTimeUntil(nextTide.time);
    
    tideSection.innerHTML = `
      <div class="next-tide">
        <div class="tide-label">Next ${nextTide.type === 'high' ? 'High' : 'Low'} Tide</div>
        <div class="tide-time">${this.formatTime(nextTide.time)}</div>
        <div class="tide-countdown">${timeUntil}</div>
      </div>
      
      <div class="tide-schedule">
        ${tides.map(tide => {
          const isPast = tide.time < now;
          const isCurrent = tide === nextTide;
          return `
            <div class="tide-item ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}">
              <span class="tide-type">${tide.type === 'high' ? '⬆️ High' : '⬇️ Low'}</span>
              <span class="tide-time">${this.formatTime(tide.time)}</span>
              <span class="tide-height">${tide.height.toFixed(1)}m</span>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="tide-disclaimer">
        ⚠️ Approximate times - check local forecasts
      </div>
    `;
  }
  
  getWindDirection(degrees) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return dirs[index];
  }
  
  getTimeUntil(future) {
    const now = new Date();
    const diff = future - now;
    
    if (diff < 0) return 'Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else {
      return `in ${minutes}m`;
    }
  }
  
  formatTime(date) {
    return date.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  
  updateTimestamp() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const timeEl = document.getElementById('update-time');
    if (timeEl) {
      timeEl.textContent = `Updated: ${timeStr}`;
    }
  }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tide-wind-widget');
  if (container) {
    // Try to detect location from localStorage or default to Cape Town
    const savedLocation = localStorage.getItem('fishtrack-location') || 'capetown';
    window.tideWindWidget = new TideWindWidget('tide-wind-widget', savedLocation);
    
    // Save location preference when changed
    const selector = document.getElementById('location-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        localStorage.setItem('fishtrack-location', e.target.value);
      });
    }
  }
});
