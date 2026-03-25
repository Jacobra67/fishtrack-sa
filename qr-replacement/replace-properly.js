#!/usr/bin/env node
/**
 * PROPER QR Code Replacement
 * Replaces ONLY the QR code portion, not the whole background
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// EXACT positions measured from the original designs
// These coordinates define where the QR code sits in each design
const positions = {
  '01': { x: 205, y: 205, size: 615 },   // Psychedelic
  '02': { x: 320, y: 230, size: 385 },   // Ocean simple
  '03': { x: 265, y: 265, size: 495 },   // Rastafarian
  '04': { x: 185, y: 150, size: 655 },   // Blue marlin
  '05': { x: 140, y: 350, size: 245 },   // Dual LEFT side
  '06': { x: 210, y: 235, size: 605 },   // Psychedelic lion
  '07': { x: 60, y: 60, size: 905 },     // Pure QR (huge)
  '08': { x: 75, y: 290, size: 370 },    // Dual LEFT ocean
  '09': { x: 190, y: 255, size: 645 },   // African pattern
  '10': { x: 215, y: 235, size: 595 }    // Cosmic
};

async function replaceQR(designPath, cleanQRPath, outputPath, designNum) {
  console.log(`\n🔧 Processing ${designPath}...`);
  
  try {
    const pos = positions[designNum];
    if (!pos) {
      console.log(`  ⚠️  No position data for design ${designNum}, skipping`);
      return false;
    }
    
    console.log(`  📍 QR Position: x=${pos.x}, y=${pos.y}, size=${pos.size}x${pos.size}`);
    
    // Load the clean QR code and resize to exact size needed
    const qrResized = await sharp(cleanQRPath)
      .resize(pos.size, pos.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();
    
    // Composite the NEW QR over the old one
    await sharp(designPath)
      .composite([{
        input: qrResized,
        top: pos.y,
        left: pos.x,
        blend: 'over'
      }])
      .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
      .withMetadata({ density: 300 })
      .toFile(outputPath);
    
    console.log(`  ✅ Saved: ${outputPath}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🎣 FishTrack QR Replacement - PROPER Edition');
  console.log('='.repeat(60));
  
  const cleanQR = 'clean-qr.jpg';
  const outputDir = 'output-final';
  
  await fs.mkdir(outputDir, { recursive: true });
  
  const files = await fs.readdir('.');
  const designs = files.filter(f => f.startsWith('design-') && f.endsWith('.jpg')).sort();
  
  if (!designs.length) {
    console.log('❌ No designs found!');
    return 1;
  }
  
  console.log(`\n📦 Processing ${designs.length} designs with clean QR`);
  console.log(`🆕 Clean QR: ${cleanQR}\n`);
  
  let successCount = 0;
  for (const designFile of designs) {
    const designNum = designFile.replace('design-', '').replace('.jpg', '');
    const outputFile = path.join(outputDir, `fishtrack-qr-${designNum}-FINAL.jpg`);
    
    const success = await replaceQR(designFile, cleanQR, outputFile, designNum);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Done! ${successCount}/${designs.length} designs processed`);
  console.log(`📁 Output: ${outputDir}/\n`);
}

main().catch(console.error);
