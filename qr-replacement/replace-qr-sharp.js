#!/usr/bin/env node
/**
 * FishTrack QR Code Replacer - Sharp Edition
 * Uses Sharp library for high-performance image manipulation
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Simple geometric QR detection based on image analysis
 * For these designs, QR codes are typically centered in a white box
 */
function estimateQRPosition(width, height, designNumber) {
  // Manual positioning based on design analysis
  // These are approximate positions for common QR code placements
  const positions = {
    // Psychedelic designs (large central QR)
    '01': { x: Math.floor(width * 0.25), y: Math.floor(height * 0.30), size: Math.floor(width * 0.50) },
    '02': { x: Math.floor(width * 0.25), y: Math.floor(height * 0.25), size: Math.floor(width * 0.50) },
    '03': { x: Math.floor(width * 0.12), y: Math.floor(height * 0.25), size: Math.floor(width * 0.75) },
    '04': { x: Math.floor(width * 0.15), y: Math.floor(height * 0.15), size: Math.floor(width * 0.70) },
    '05': { x: Math.floor(width * 0.15), y: Math.floor(height * 0.25), size: Math.floor(width * 0.35) },
    '06': { x: Math.floor(width * 0.25), y: Math.floor(height * 0.25), size: Math.floor(width * 0.50) },
    '07': { x: Math.floor(width * 0.10), y: Math.floor(height * 0.10), size: Math.floor(width * 0.80) },
    '08': { x: Math.floor(width * 0.15), y: Math.floor(height * 0.25), size: Math.floor(width * 0.35) },
    '09': { x: Math.floor(width * 0.15), y: Math.floor(height * 0.30), size: Math.floor(width * 0.70) },
    '10': { x: Math.floor(width * 0.25), y: Math.floor(height * 0.30), size: Math.floor(width * 0.50) }
  };
  
  return positions[designNumber] || {
    x: Math.floor(width * 0.25),
    y: Math.floor(height * 0.25),
    size: Math.floor(width * 0.50)
  };
}

/**
 * Replace QR code in design
 */
async function replaceQR(designPath, newQRPath, outputPath, designNumber) {
  console.log(`\n📝 Processing: ${designPath}`);
  
  try {
    // Get design dimensions
    const designMeta = await sharp(designPath).metadata();
    const { width, height } = designMeta;
    
    console.log(`  📐 Design size: ${width}x${height}`);
    
    // Estimate QR position
    const qrPos = estimateQRPosition(width, height, designNumber);
    console.log(`  🎯 QR position: x=${qrPos.x}, y=${qrPos.y}, size=${qrPos.size}x${qrPos.size}`);
    
    // Resize new QR to match
    const resizedQR = await sharp(newQRPath)
      .resize(qrPos.size, qrPos.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill'
      })
      .toBuffer();
    
    // Composite new QR onto design
    await sharp(designPath)
      .composite([{
        input: resizedQR,
        top: qrPos.y,
        left: qrPos.x
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

/**
 * Main function
 */
async function main() {
  console.log('🎣 FishTrack QR Code Replacer - Professional Edition');
  console.log('='.repeat(60));
  
  const newQRPath = 'new-qr.jpg';
  const outputDir = 'output';
  
  // Create output directory
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (e) {}
  
  // Find all design files
  const files = await fs.readdir('.');
  const designs = files
    .filter(f => f.startsWith('design-') && f.endsWith('.jpg'))
    .sort();
  
  if (designs.length === 0) {
    console.log('❌ No design files found!');
    process.exit(1);
  }
  
  console.log(`\n📦 Found ${designs.length} designs to process`);
  console.log(`🆕 New QR: ${newQRPath}\n`);
  
  // Process each design
  let successCount = 0;
  for (const designFile of designs) {
    const designNum = designFile.replace('design-', '').replace('.jpg', '');
    const outputFile = path.join(outputDir, `fishtrack-qr-${designNum}-PRINT.jpg`);
    
    const success = await replaceQR(designFile, newQRPath, outputFile, designNum);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Complete! ${successCount}/${designs.length} images processed`);
  console.log(`📁 Output directory: ${outputDir}/`);
  console.log('\n🖨️  All files are print-ready at 300 DPI, 100% quality!');
  console.log(`🚀 FishTrack Africa - Track the Bite!\n`);
}

// Run
main().catch(console.error);
