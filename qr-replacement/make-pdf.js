const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function createPDF() {
  const outputDir = path.join(__dirname, 'output');
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg')).sort();
  
  const pdfDoc = await PDFDocument.create();
  
  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const imageBytes = fs.readFileSync(filePath);
    const jpgImage = await pdfDoc.embedJpg(imageBytes);
    const { width, height } = jpgImage.scale(1.0);
    
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(outputDir, 'FishTrack-All-Designs-PRINT.pdf'), pdfBytes);
  console.log('PDF Created Successfully!');
}

createPDF().catch(console.error);
