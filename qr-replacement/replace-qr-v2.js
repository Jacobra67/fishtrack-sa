#!/usr/bin/env node
/**
 * FishTrack QR Code Replacer - Version 2 (Improved Positioning)
 * Accurately replaces QR codes by analyzing actual design layouts
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Precise QR positioning based on actual design analysis
 * These coordinates were measured from the original images
 */
function getQRPosition(width, height, designNumber) {
  const positions = {
    // Design 1: Psychedelic with fishing gear - QR is large and centered
    '01': { x: Math.floor(width * 0.20), y: Math.floor(height * 0.20), size: Math.floor(width * 0.60) },
    
    // Design 2: Ocean waves simple - QR is medium center
    '02': { x: Math.floor(width * 0.23), y: Math.floor(height * 0.23), size: Math.floor(width * 0.54) },
    
    // Design 3: Rastafarian lion - QR is large center with yellow background
    '03': { x: Math.floor(width * 0.15), y: Math.floor(height * 0.20), size: Math.floor(width * 0.70) },
    
    // Design 4: Blue marlin action - QR is large center
    '04': { x: Math.floor(width * 0.18), y: Math.floor(height * 0.18), size: Math.floor(width * 0.64) },
    
    // Design 5: Dual design - TWO QR codes! Left and right
    // For now, we'll replace the LEFT one (blue ocean theme)
    '05': { x: Math.floor(width * 0.12), y: Math.floor(height * 0.32), size: Math.floor(width * 0.23) },
    
    // Design 6: Psychedelic lion/fish - Large center QR
    '06': { x: Math.floor(width * 0.22), y: Math.floor(height * 0.23), size: Math.floor(width * 0.56) },
    
    // Design 7: Pure QR code - This IS the QR code (huge!)
    '07': { x: Math.floor(width * 0.08), y: Math.floor(height * 0.08), size: Math.floor(width * 0.84) },
    
    // Design 8: Ocean/tiger dual - TWO QR codes side by side
    // Replace the LEFT one (ocean blue)
    '08': { x: Math.floor(width * 0.07), y: Math.floor(height * 0.27), size: Math.floor(width * 0.35) },
    
    // Design 9: African traditional pattern - Large center QR
    '09': { x: Math.floor(width * 0.18), y: Math.floor(height * 0.24), size: Math.floor(width * 0.64) },
    
    // Design 10: Cosmic psychedelic - Large center QR
    '10': { x: Math.floor(width * 0.21), y: Math.floor(height * 0.23), size: Math.floor(width * 0.58) }
  };
  
  return positions[designNumber] || {
    x: Math.floor(width * 0.25),
    y: Math.floor(height * 0.25),
    size: Math.floor(width * 0.50)
  };
}

/**
 * For dual-design images (5 and 8), also replace the RIGHT QR code
 */
function hasRightQR(designNumber) {
  return designNumber === '05' || designNumber === '08';
}

function getRightQRPosition(width, height, designNumber) {
  const positions = {
    '05': { x: Math.floor(width * 0.65), y: Math.floor(height * 0.32), size: Math.floor(width * 0.23) },
    '08': { x: Math.floor(width * 0.58), y: Math.floor(height * 0.27), size: Math.floor(width * 0.35) }
  };
  
  return positions[designNumber];
}

/**
 * Replace QR code(s) in design
 */
async function replaceQR(designPath, newQRPath, outputPath, designNumber) {
  console.log(`\n📝 Processing: ${designPath}`);
  
  try {
    // Get design dimensions
    const designMeta = await sharp(designPath).metadata();
    const { width, height } = designMeta;
    
    console.log(`  📐 Design size: ${width}x${height}`);
    
    // Get QR position(s)
    const qrPos = getQRPosition(width, height, designNumber);
    console.log(`  🎯 QR position: x=${qrPos.x}, y=${qrPos.y}, size=${qrPos.size}x${qrPos.size}`);
    
    // Prepare composites array
    const composites = [];
    
    // Resize new QR for main position
    const resizedQR = await sharp(newQRPath)
      .resize(qrPos.size, qrPos.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill'
      })
      .toBuffer();
    
    composites.push({
      input: resizedQR,
      top: qrPos.y,
      left: qrPos.x
    });
    
    // If this design has TWO QR codes, add the second one
    if (hasRightQR(designNumber)) {
      const rightQrPos = getRightQRPosition(width, height, designNumber);
      console.log(`  🎯 Right QR position: x=${rightQrPos.x}, y=${rightQrPos.y}, size=${rightQrPos.size}x${rightQrPos.size}`);
      
      const resizedQRRight = await sharp(newQRPath)
        .resize(rightQrPos.size, rightQrPos.size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill'
        })
        .toBuffer();
      
      composites.push({
        input: resizedQRRight,
        top: rightQrPos.y,
        left: rightQrPos.x
      });
    }
    
    // Composite new QR(s) onto design
    await sharp(designPath)
      .composite(composites)
      .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
      .withMetadata({ density: 300 })
      .toFile(outputPath);
    
    console.log(`  ✅ Saved: ${outputPath}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎣 FishTrack QR Code Replacer - V2 (Precision Edition)');
  console.log('='.repeat(60));
  
  const newQRPath = 'new-qr.jpg';
  const outputDir = 'output-v2';
  
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
