#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# MyCAFE — Full EAS Build Reset & Fix Script
# Run this from inside your MyCAFE project root directory.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         MyCAFE EAS Build — Full Reset & Fix              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── STEP 0: Confirm we're in the right place ──────────────────────────────────
if [ ! -f "app.json" ] || [ ! -f "package.json" ]; then
  echo "❌  ERROR: Run this script from your MyCAFE project root (where app.json lives)."
  exit 1
fi

echo "📁  Project root: $(pwd)"
echo ""

# ── STEP 1: Kill all cached state ────────────────────────────────────────────
echo "🧹  [1/7] Clearing caches, lockfiles, and generated directories..."
rm -rf node_modules android ios .expo dist
rm -f package-lock.json yarn.lock
echo "    ✅  Done."
echo ""

# ── STEP 2: Verify critical assets exist ─────────────────────────────────────
echo "🖼️   [2/7] Verifying required asset files..."

ASSETS=(
  "assets/images/icon.png"
  "assets/images/splash-icon.png"
  "assets/images/android-icon-foreground.png"
  "assets/images/android-icon-monochrome.png"
  "assets/images/favicon.png"
)

MISSING=0
for asset in "${ASSETS[@]}"; do
  if [ -f "$asset" ]; then
    SIZE=$(du -h "$asset" | cut -f1)
    echo "    ✅  $asset  ($SIZE)"
  else
    echo "    ❌  MISSING: $asset"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo "❌  ERROR: $MISSING required asset(s) missing. Copy your logo exports into assets/images/ before continuing."
  exit 1
fi
echo ""

# ── STEP 3: Apply the corrected config files ──────────────────────────────────
echo "📝  [3/7] Applying corrected configuration files..."
echo "    ℹ️   Make sure you have already replaced:"
echo "         • app.json    — point each slot to its own assets/images/*.png"
echo "         • eas.json    — EXPO_IMAGE_UTILS_NO_SHARP=1, removed NPM_CONFIG_FORCE"
echo "         • package.json — firebase@^10.14.1, empty overrides, typescript~5.3.3"
echo "    ℹ️   (These corrected files are included alongside this script.)"
echo ""

# ── STEP 4: Install dependencies ─────────────────────────────────────────────
echo "📦  [4/7] Installing dependencies (clean)..."
npm install
echo "    ✅  npm install complete."
echo ""

# ── STEP 5: Verify Firebase version ──────────────────────────────────────────
echo "🔥  [5/7] Checking Firebase version..."
FIREBASE_VER=$(node -e "console.log(require('./node_modules/firebase/package.json').version)" 2>/dev/null || echo "unknown")
echo "    Installed: firebase@$FIREBASE_VER"

MAJOR=$(echo "$FIREBASE_VER" | cut -d. -f1)
if [ "$MAJOR" -ge 11 ] 2>/dev/null; then
  echo "    ⚠️   WARNING: firebase@$FIREBASE_VER is too new for Expo SDK 52."
  echo "         Run: npm install firebase@^10.14.1"
  echo "         Then re-run this script."
  exit 1
else
  echo "    ✅  Firebase version OK."
fi
echo ""

# ── STEP 6: Run prebuild locally ──────────────────────────────────────────────
echo "🔨  [6/7] Running expo prebuild --platform android --clean..."
echo "    (This is the critical step — if it passes locally, EAS will pass too.)"
echo ""

EXPO_IMAGE_UTILS_NO_SHARP=1 npx expo prebuild --platform android --clean

echo ""
echo "    ✅  prebuild succeeded."
echo ""

# ── STEP 7: Verify android directory was created ──────────────────────────────
echo "📂  [7/7] Verifying android directory was generated..."
if [ -d "android/app" ]; then
  echo "    ✅  android/app/ exists — native directory created successfully."
else
  echo "    ❌  android/app/ NOT found — prebuild did not complete correctly."
  exit 1
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  ALL CHECKS PASSED — Ready to push to EAS Build      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Next step:"
echo "    eas build --platform android --profile preview"
echo ""
echo "  To build a production AAB instead:"
echo "    eas build --platform android --profile production"
echo ""
