#!/bin/bash
# FishTrack Health Check Script
# Run by Bob to verify all systems operational

echo "🏥 FishTrack SA Health Check"
echo "=============================="
echo ""

# 1. Check if site is up
echo "1️⃣ Checking site availability..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://fishtrack-sa.netlify.app)
if [ "$STATUS" == "200" ]; then
    echo "   ✅ Site is UP (HTTP $STATUS)"
else
    echo "   ❌ Site is DOWN or unreachable (HTTP $STATUS)"
    exit 1
fi

# 2. Check if version.txt is accessible
echo ""
echo "2️⃣ Checking version system..."
VERSION=$(curl -s https://fishtrack-sa.netlify.app/version.txt)
if [ -n "$VERSION" ]; then
    echo "   ✅ Version file accessible: $VERSION"
else
    echo "   ❌ Version file not found"
fi

# 3. Check page load time
echo ""
echo "3️⃣ Checking page load time..."
START=$(date +%s%N)
curl -s https://fishtrack-sa.netlify.app > /dev/null
END=$(date +%s%N)
DURATION=$((($END - $START) / 1000000)) # Convert to milliseconds
if [ $DURATION -lt 3000 ]; then
    echo "   ✅ Page loads in ${DURATION}ms (good)"
elif [ $DURATION -lt 5000 ]; then
    echo "   ⚠️  Page loads in ${DURATION}ms (acceptable)"
else
    echo "   ❌ Page loads in ${DURATION}ms (SLOW)"
fi

# 4. Check if Firebase config is accessible
echo ""
echo "4️⃣ Checking Firebase connection..."
FIREBASE_CONFIG=$(curl -s https://fishtrack-sa.netlify.app/js/firebase-config.js | grep -o "fishtrack-sa" | head -1)
if [ "$FIREBASE_CONFIG" == "fishtrack-sa" ]; then
    echo "   ✅ Firebase config present"
else
    echo "   ❌ Firebase config missing or changed"
fi

# 5. Check if map page loads
echo ""
echo "5️⃣ Checking map page..."
MAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://fishtrack-sa.netlify.app/map.html)
if [ "$MAP_STATUS" == "200" ]; then
    echo "   ✅ Map page accessible"
else
    echo "   ❌ Map page not loading (HTTP $MAP_STATUS)"
fi

# 6. Check if log-catch page loads
echo ""
echo "6️⃣ Checking catch logger..."
LOGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://fishtrack-sa.netlify.app/log-catch.html)
if [ "$LOGGER_STATUS" == "200" ]; then
    echo "   ✅ Logger page accessible"
else
    echo "   ❌ Logger page not loading (HTTP $LOGGER_STATUS)"
fi

# 7. Summary
echo ""
echo "=============================="
echo "✅ Health Check Complete"
echo "=============================="
echo ""
echo "📊 Summary:"
echo "   • Site Status: UP"
echo "   • Page Load: ${DURATION}ms"
echo "   • Version: $VERSION"
echo "   • Last Check: $(date)"
echo ""
echo "🔗 Quick Links:"
echo "   • Site: https://fishtrack-sa.netlify.app"
echo "   • Netlify: https://app.netlify.com/sites/fishtrack-sa"
echo "   • Firebase: https://console.firebase.google.com/project/fishtrack-sa"
echo ""
