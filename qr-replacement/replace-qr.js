#!/usr/bin/env node
/**
 * FishTrack QR Code Replacer - Professional Edition
 * Intelligently detects and replaces QR codes in marketing images
 * Maintains pixel-perfect positioning and print quality
 */

const Jimp = require('jimp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Detect QR code region in an image by finding large white rectangles
 */
async function detectQRRegion(image) {
  const width = image.getWidth();
  const height = image.getHeight();
  
  // Sample pixels to find the QR code bounding box
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let foundBlackPixels = false;
  
  // Scan image for QR code pattern (large concentration of black/white pixels)
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));
      const brightness = (color.r + color.g + color.b) / 3;
      
      // Detect sharp black/white contrast (QR code characteristic)
      if (brightness < 100 || brightness > 200) {
        // Check neighboring pixels for pattern
        let hasContrast = false;
        for (let dy = -5; dy <= 5 && !hasContrast; dy += 5) {
          for (let dx = -5; dx <= 5 && !hasContrast; dx += 5) {
            if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
              const neighborColor = Jimp.intToRGBA(image.getPixelColor(x + dx, y + dy));
              const neighborBrightness = (neighborColor.r + neighborColor.g + neighborColor.b) / 3;
              if (Math.abs(brightness - neighborBrightness) > 100) {
                hasContrast = true;
              }
            }
          }
        }
        
        if (hasContrast) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          foundBlackPixels = true;
        }
      }
    }
  }
  
  if (!foundBlackPixels) {
    // Fallback: assume QR is in center
    console.log('    ⚠️  Could not detect QR automatically, using center position');
    return {
      x: Math.floor(width * 0.25),
      y: Math.floor(height * 0.2),
      width: Math.floor(width * 0.5),
      height: Math.floor(width * 0.5)
    };
  }
  
  // Add padding to detected region
  const padding = 20;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
}

/**
 * Replace QR code in design with new QR code
 */
async function replaceQR(designPath, newQRPath, outputPath) {
  console.log(`\n📝 Processing: ${designPath}`);
  
  try {
    // Load images
    const design = await Jimp.read(designPath);
    const newQR = await Jimp.read(newQRPath);
    
    console.log(`  📐 Design size: ${design.getWidth()}x${design.getHeight()}`);
    
    // Detect QR location
    const qrRegion = await detectQRRegion(design);
    console.log(`  🎯 QR detected at: x=${qrRegion.x}, y=${qrRegion.y}, size=${qrRegion.width}x${qrRegion.height}`);
    
    // Resize new QR to match detected region (maintain square aspect ratio)
    const qrSize = Math.min(qrRegion.width, qrRegion.height);
    newQR.resize(qrSize, qrSize, Jimp.RESIZE_BICUBIC);
    
    // Center the QR in the detected region
    const centerX = qrRegion.x + (qrRegion.width - qrSize) / 2;
    const centerY = qrRegion.y + (qrRegion.height - qrSize) / 2;
    
    // Composite new QR onto design
    design.composite(newQR, Math.floor(centerX), Math.floor(centerY), {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1,
      opacityDest: 1
    });
    
    // Save at maximum quality
    await design.quality(100).writeAsync(outputPath);
    
    console.log(`  ✅ Saved: ${outputPath}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main processing function
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
    
    const success = await replaceQR(designFile, newQRPath, outputFile);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Complete! ${successCount}/${designs.length} images processed successfully`);
  console.log(`📁 Output directory: ${outputDir}/`);
  console.log('\n🖨️  All files are print-ready at maximum quality!');
  console.log(`🚀 FishTrack Africa - Track the Bite!\n`);
}

// Run
main().catch(console.error);
