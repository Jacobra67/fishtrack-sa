// Auto-fill fishing conditions based on GPS location
// Fetches tide, wind, and weather data for the catch location

const WORLDTIDES_API_KEY = '77c0a0c4-8fca-41fa-8054-42ea3c80566b';

/**
 * Fetch current conditions for a GPS location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} waterType - 'Saltwater' or 'Freshwater'
 * @returns {Promise<Object>} - { tide, wind, waterTemp }
 */
async function fetchConditions(lat, lng, waterType) {
    console.log('Fetching conditions for:', lat, lng, waterType);
    
    const conditions = {
        tide: null,
        wind: null,
        waterTemp: null,
        airTemp: null
    };
    
    try {
        // Fetch wind and temperature (Open-Meteo - FREE, no key needed)
        const weatherPromise = fetchWeather(lat, lng);
        
        // Fetch tide (only for saltwater)
        const tidePromise = waterType === 'Saltwater' 
            ? fetchTide(lat, lng)
            : Promise.resolve(null);
        
        // Wait for both API calls
        const [weather, tide] = await Promise.all([weatherPromise, tidePromise]);
        
        if (weather) {
            conditions.wind = weather.wind;
            conditions.airTemp = weather.temperature;
            // For coastal areas, air temp is often close to water temp (rough estimate)
            conditions.waterTemp = weather.temperature; 
        }
        
        if (tide) {
            conditions.tide = tide;
        }
        
        return conditions;
        
    } catch (error) {
        console.error('Error fetching conditions:', error);
        return conditions; // Return partial data if available
    }
}

/**
 * Fetch wind and temperature from Open-Meteo (FREE)
 */
async function fetchWeather(lat, lng) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API failed');
        
        const data = await response.json();
        const current = data.current;
        
        // Format wind string
        const windSpeed = Math.round(current.wind_speed_10m);
        const windDir = getWindDirection(current.wind_direction_10m);
        const windString = windSpeed < 5 
            ? 'Calm' 
            : `${getWindStrength(windSpeed)} ${windDir}`;
        
        return {
            wind: windString,
            temperature: Math.round(current.temperature_2m)
        };
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
}

/**
 * Fetch current tide state from WorldTides API
 */
async function fetchTide(lat, lng) {
    try {
        // Get extremes (high/low tides) for today
        const now = Math.floor(Date.now() / 1000);
        const start = now - (12 * 3600); // 12 hours ago
        const end = now + (12 * 3600);   // 12 hours ahead
        
        const url = `https://www.worldtides.info/api/v3?extremes&lat=${lat}&lon=${lng}&start=${start}&length=${end - start}&key=${WORLDTIDES_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Tide API failed');
        
        const data = await response.json();
        
        if (!data.extremes || data.extremes.length === 0) {
            return 'N/A'; // No tide data available (maybe too far from coast)
        }
        
        // Determine current tide state
        const extremes = data.extremes.map(e => ({
            time: new Date(e.dt * 1000),
            type: e.type // 'High' or 'Low'
        }));
        
        // Find the two extremes surrounding "now"
        const nowDate = new Date();
        let before = null;
        let after = null;
        
        for (let i = 0; i < extremes.length; i++) {
            if (extremes[i].time <= nowDate) {
                before = extremes[i];
            } else if (!after) {
                after = extremes[i];
                break;
            }
        }
        
        // Determine tide state
        if (!before || !after) {
            // Not enough data, return next tide type
            const next = extremes.find(e => e.time > nowDate);
            return next ? next.type : 'N/A';
        }
        
        // If moving from Low → High, tide is Rising
        // If moving from High → Low, tide is Falling
        if (before.type === 'Low' && after.type === 'High') {
            return 'Rising';
        } else if (before.type === 'High' && after.type === 'Low') {
            return 'Falling';
        }
        
        // If we're very close to an extreme, call it High/Low
        const timeSinceBefore = nowDate - before.time;
        const timeUntilAfter = after.time - nowDate;
        
        if (timeSinceBefore < 30 * 60 * 1000) { // Within 30 min of before
            return before.type;
        } else if (timeUntilAfter < 30 * 60 * 1000) { // Within 30 min of after
            return after.type;
        }
        
        // Default to Rising/Falling
        return before.type === 'Low' ? 'Rising' : 'Falling';
        
    } catch (error) {
        console.error('Tide fetch error:', error);
        return null;
    }
}

/**
 * Convert wind direction degrees to compass direction
 */
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Get wind strength description
 */
function getWindStrength(speedKmh) {
    if (speedKmh < 5) return 'Calm';
    if (speedKmh < 20) return 'Light';
    if (speedKmh < 40) return 'Moderate';
    if (speedKmh < 60) return 'Strong';
    return 'Very Strong';
}

// Export for use in catch logger
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchConditions };
}
