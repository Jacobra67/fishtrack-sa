# QR Code Android Fix

## Problem
Original QR code (`qr_base.png`) scans fine on iPhone but not on Android devices.

## Solution
Generated new QR code (`qr_android_fixed.png`) with Android-optimized settings:

**Settings:**
- Size: 1000x1000px (larger = better scan)
- Error Correction: H level (30% recovery - highest)
- Quiet Zone: 4 modules (white border around QR)
- Format: Pure black/white PNG (no gradients)
- Data: https://fishtrack-sa.netlify.app

## Testing
✅ **iPhone:** Works  
✅ **Android:** Should now work (test with multiple Android devices)

## Why Android is Pickier
- Android QR scanners often require:
  - Higher contrast (pure black/white)
  - Larger quiet zone (white border)
  - Higher error correction
  - Bigger overall size

- iPhone's camera is more forgiving with QR codes

## File Usage
- `qr_android_fixed.png` - Use this for printing/distribution
- `qr-sticker.html` - Updated to use new QR code
- Download high-res sticker from `qr-sticker.html` in browser

## Printing Tips
- Test scan before mass printing!
- Print at 300 DPI minimum
- Use weatherproof vinyl sticker paper
- Recommended size: 3" x 3" (75mm x 75mm)
