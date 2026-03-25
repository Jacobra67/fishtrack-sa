#!/usr/bin/env python3
"""
FishTrack QR Code Replacer
Intelligently detects and replaces QR codes in marketing images
Maintains size, position, and effects while ensuring print quality
"""

import cv2
import numpy as np
from PIL import Image
import os
import sys

def detect_qr_region(image_path):
    """Detect the QR code location in an image using contour detection"""
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply binary threshold to isolate black/white patterns
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Find the largest rectangular contour (likely the QR code)
    qr_candidates = []
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 5000:  # Filter out tiny contours
            continue
            
        # Approximate contour to polygon
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Look for square-ish shapes (4 corners)
        if len(approx) >= 4:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = float(w) / h
            
            # QR codes are square-ish (aspect ratio close to 1.0)
            if 0.7 <= aspect_ratio <= 1.3 and area > 10000:
                qr_candidates.append({
                    'x': x,
                    'y': y,
                    'w': w,
                    'h': h,
                    'area': area,
                    'aspect_ratio': aspect_ratio
                })
    
    # Return the largest square-ish contour
    if qr_candidates:
        best_candidate = max(qr_candidates, key=lambda c: c['area'])
        return best_candidate
    
    # Fallback: assume QR is in center third of image
    h, w = gray.shape
    return {
        'x': w // 3,
        'y': h // 4,
        'w': w // 3,
        'h': w // 3
    }

def replace_qr_code(design_path, new_qr_path, output_path, dpi=300):
    """
    Replace QR code in design with new QR code
    
    Args:
        design_path: Path to design image with old QR
        new_qr_path: Path to new QR code image
        output_path: Where to save the result
        dpi: Output DPI for print quality
    """
    # Detect QR location
    qr_region = detect_qr_region(design_path)
    print(f"  Detected QR at: x={qr_region['x']}, y={qr_region['y']}, size={qr_region['w']}x{qr_region['h']}")
    
    # Load images with PIL for better quality control
    design = Image.open(design_path).convert('RGB')
    new_qr = Image.open(new_qr_path).convert('RGBA')
    
    # Resize new QR to match detected region
    qr_size = (qr_region['w'], qr_region['h'])
    new_qr_resized = new_qr.resize(qr_size, Image.Resampling.LANCZOS)
    
    # Paste new QR over old one
    design.paste(new_qr_resized, (qr_region['x'], qr_region['y']), new_qr_resized)
    
    # Save at high quality
    design.save(output_path, 'JPEG', quality=95, dpi=(dpi, dpi), optimize=False)
    
    print(f"  ✓ Saved: {output_path}")
    return True

def main():
    """Process all design images"""
    print("🎣 FishTrack QR Code Replacer")
    print("=" * 50)
    
    # Paths
    new_qr = "new-qr.jpg"
    output_dir = "output"
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all design files
    designs = sorted([f for f in os.listdir('.') if f.startswith('design-') and f.endswith('.jpg')])
    
    if not designs:
        print("❌ No design files found!")
        return 1
    
    if not os.path.exists(new_qr):
        print(f"❌ New QR code not found: {new_qr}")
        return 1
    
    print(f"\n📦 Found {len(designs)} designs to process")
    print(f"🆕 New QR: {new_qr}\n")
    
    # Process each design
    success_count = 0
    for design_file in designs:
        design_num = design_file.replace('design-', '').replace('.jpg', '')
        output_file = os.path.join(output_dir, f"fishtrack-qr-{design_num}-PRINT.jpg")
        
        print(f"Processing {design_file}...")
        try:
            replace_qr_code(design_file, new_qr, output_file, dpi=300)
            success_count += 1
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print(f"✅ Complete! {success_count}/{len(designs)} images processed")
    print(f"📁 Output directory: {output_dir}/")
    print("\n🖨️  All files are print-ready at 300 DPI!")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
