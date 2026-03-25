#!/bin/bash
# FishTrack Safe Deployment Setup
# Run this once to configure dev/staging environment

set -e  # Exit on error

echo "========================================="
echo "FishTrack Safe Deployment Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Not in FishTrack directory"
    echo "   Please cd to fishtrack-sa folder first"
    exit 1
fi

echo "✅ In FishTrack directory"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    echo "   Please run: git init"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Create dev branch if it doesn't exist
if git show-ref --verify --quiet refs/heads/dev; then
    echo "✅ Dev branch already exists"
else
    echo "📝 Creating dev branch..."
    git checkout -b dev
    echo "✅ Dev branch created"
fi

echo ""

# Push dev branch to origin
echo "📤 Pushing dev branch to GitHub..."
if git push -u origin dev 2>/dev/null; then
    echo "✅ Dev branch pushed to GitHub"
else
    echo "⚠️  Dev branch already on GitHub (or no changes to push)"
fi

echo ""

# Display staging URL
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Your environments:"
echo ""
echo "🟢 Production (main branch):"
echo "   https://fishtrack-sa.netlify.app"
echo ""
echo "🟡 Staging (dev branch):"
echo "   https://dev--fishtrack-sa.netlify.app"
echo ""
echo "📋 Next steps:"
echo "   1. Go to Netlify: https://app.netlify.com/sites/fishtrack-sa/settings/deploys"
echo "   2. Under 'Branch deploys', select 'All'"
echo "   3. Click 'Save'"
echo ""
echo "Then you can:"
echo "   - Work in dev branch: git checkout dev"
echo "   - Test on staging: https://dev--fishtrack-sa.netlify.app"
echo "   - Deploy to production: git checkout main && git merge dev && git push"
echo ""
echo "Read SAFE_DEPLOYMENT_GUIDE.md for full workflow!"
echo ""
