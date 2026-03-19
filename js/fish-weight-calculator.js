// Fish Weight Calculator
// Calculates estimated weight from length using species-specific formulas
// Based on standard length-weight relationships for South African fish

// Weight (grams) = a × Length^b (Length in cm)
// Convert to kg by dividing by 1000

const FISH_FORMULAS = {
  // SALTWATER SPECIES
  'Galjoen': { a: 0.0158, b: 3.05 },
  'Steenbras': { a: 0.0142, b: 3.12 },
  'Red Steenbras': { a: 0.0165, b: 3.08 },
  'Kabeljou': { a: 0.0095, b: 3.15 },
  'Mosselkraker': { a: 0.0175, b: 3.05 },
  'Rock Cod': { a: 0.0125, b: 3.10 },
  'Blacktail': { a: 0.0135, b: 3.08 },
  'Kolstert': { a: 0.0145, b: 3.06 },
  'Zebra': { a: 0.0138, b: 3.07 },
  'Strepie': { a: 0.0142, b: 3.06 },
  'Bronze Bream': { a: 0.0140, b: 3.07 },
  'Rooi Roman': { a: 0.0148, b: 3.08 },
  'Poenskop': { a: 0.0132, b: 3.09 },
  'Baardman': { a: 0.0128, b: 3.11 },
  'Santer': { a: 0.0155, b: 3.06 },
  
  // Sharks (larger coefficient for heavy-bodied fish)
  'Bronze Whaler': { a: 0.0085, b: 3.18 },
  'Spotted Gully': { a: 0.0078, b: 3.20 },
  'Copper Shark': { a: 0.0082, b: 3.19 },
  'Smooth-Hound': { a: 0.0088, b: 3.17 },
  
  // Gamefish (streamlined, lighter for length)
  'Elf': { a: 0.0065, b: 3.25 },
  'Garrick': { a: 0.0058, b: 3.28 },
  'Springer': { a: 0.0072, b: 3.22 },
  'Snoek': { a: 0.0045, b: 3.35 },
  
  // Rays (very flat, lighter for length)
  'Eagle Ray': { a: 0.0095, b: 3.12 },
  'Blue Stingray': { a: 0.0105, b: 3.10 },
  
  // FRESHWATER SPECIES
  'Largemouth Bass': { a: 0.0110, b: 3.20 },
  'Smallmouth Bass': { a: 0.0115, b: 3.18 },
  'Spotted Bass': { a: 0.0112, b: 3.19 },
  
  'Mirror Carp': { a: 0.0145, b: 3.12 },
  'Common Carp': { a: 0.0142, b: 3.13 },
  'Koi Carp': { a: 0.0140, b: 3.12 },
  'Grass Carp': { a: 0.0135, b: 3.14 },
  
  'Rainbow Trout': { a: 0.0095, b: 3.15 },
  'Brown Trout': { a: 0.0098, b: 3.14 },
  
  'Smallmouth Yellowfish': { a: 0.0125, b: 3.10 },
  'Largemouth Yellowfish': { a: 0.0120, b: 3.12 },
  'Sharptooth Catfish': { a: 0.0088, b: 3.18 },
  'Vundu': { a: 0.0075, b: 3.22 },
  'Mozambique Tilapia': { a: 0.0155, b: 3.05 },
  'Banded Tilapia': { a: 0.0152, b: 3.06 },
  'Bream': { a: 0.0148, b: 3.07 }
};

/**
 * Calculate fish weight from length
 * @param {string} species - Fish species name
 * @param {number} lengthCm - Length in centimeters
 * @returns {number|null} - Estimated weight in kg, or null if species not supported
 */
function calculateFishWeight(species, lengthCm) {
  const formula = FISH_FORMULAS[species];
  
  if (!formula) {
    console.warn('No weight formula for species:', species);
    return null;
  }
  
  if (!lengthCm || lengthCm <= 0 || lengthCm > 500) {
    console.warn('Invalid length:', lengthCm);
    return null;
  }
  
  // Weight (g) = a × Length^b
  const weightGrams = formula.a * Math.pow(lengthCm, formula.b);
  
  // Convert to kg and round to 1 decimal
  const weightKg = Math.round(weightGrams / 100) / 10;
  
  return weightKg;
}

/**
 * Check if species has weight calculation support
 * @param {string} species - Fish species name
 * @returns {boolean}
 */
function hasWeightFormula(species) {
  return FISH_FORMULAS.hasOwnProperty(species);
}

// Export for use in catch logger
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateFishWeight, hasWeightFormula };
}
