#!/bin/bash
# ============================================
#  Auto Extension Installer — macOS
# ============================================
set -e
echo ""
echo " ============================================"
echo "  Auto Extension Installer"
echo " ============================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/3] Enabling Adobe CEP debug mode..."
for ver in {3..13}; do
  defaults write "com.adobe.CSXS.$ver" PlayerDebugMode 1 2>/dev/null || true
done
echo "      Done."

FOUND_DIR=""

while IFS= read -r manifest; do
  candidate="$(dirname "$manifest")"
  # Must be inside a CSXS folder
  if [[ "$candidate" == *"/CSXS" ]]; then
    # Skip anything outside our script's directory
    if [[ "$candidate" == "$SCRIPT_DIR"* ]]; then
      # Go up one level from CSXS
      FOUND_DIR="$(dirname "$candidate")"
      break
    fi
  fi
done < <(find "$SCRIPT_DIR" -name "manifest.xml" 2>/dev/null)

if [ -z "$FOUND_DIR" ]; then
  echo " ERROR: Could not find CSXS/manifest.xml in any subfolder."
  exit 1
fi

EXTNAME="$(basename "$FOUND_DIR")"

DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/$EXTNAME"

echo ""
echo "[2/3] Installing:"
echo "      $EXTNAME"
echo "      Source: $FOUND_DIR"
echo "      Destination: $DEST"
echo ""

mkdir -p "$DEST"
cp -R "$FOUND_DIR/" "$DEST/"

echo "[3/3] Files copied."
echo ""
echo " ============================================"
echo "  Install complete!"
echo "  Open After Effects -> Window -> Extensions"
echo "  -> $EXTNAME"
echo " ============================================"
echo ""