#!/usr/bin/env python3
from PIL import Image
import os

# Load the original logo
logo_path = 'assets/logo-original.jpg'
logo = Image.open(logo_path)

# Convert to RGBA if needed
if logo.mode != 'RGBA':
    logo = logo.convert('RGBA')

# Create 192x192 icon
icon_192 = logo.resize((192, 192), Image.Resampling.LANCZOS)
icon_192.save('assets/icon-192.png', 'PNG')
print("✅ Created icon-192.png")

# Create 512x512 icon
icon_512 = logo.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save('assets/icon-512.png', 'PNG')
print("✅ Created icon-512.png")

# Create 180x180 for Apple
icon_180 = logo.resize((180, 180), Image.Resampling.LANCZOS)
icon_180.save('assets/apple-touch-icon.png', 'PNG')
print("✅ Created apple-touch-icon.png")

print("\n🎨 All icons created successfully!")
