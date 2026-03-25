#!/bin/bash
# FishTrack Version Update Script
# Updates version in all necessary files

if [ -z "$1" ]; then
  echo "Usage: ./update-version.sh v3.6.0-2026-03-26"
  echo "Current version:"
  cat version.txt
  exit 1
fi

NEW_VERSION="$1"

echo "🔄 Updating FishTrack to $NEW_VERSION..."

# Update version.txt
echo "$NEW_VERSION" > version.txt
echo "✅ Updated version.txt"

# Update meta tags in HTML files
for file in index.html map.html log-catch.html my-logbook.html; do
  if [ -f "$file" ]; then
    sed -i "s/name=\"app-version\" content=\".*\"/name=\"app-version\" content=\"$NEW_VERSION\"/" "$file"
    echo "✅ Updated $file"
  fi
done

echo ""
echo "✅ Version updated to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "1. git add -A"
echo "2. git commit -m \"Bump version to $NEW_VERSION\""
echo "3. git push origin dev"
echo ""
echo "After deploy, users will see update banner within 15 seconds!"
