#!/bin/bash
# Store screenshots from iOS simulators.
#
# Prerequisites:
#   1. A Debug simulator build (ios/build, e.g. from `npx expo run:ios`) – it loads
#      JS from Metro, so start Metro with the driver flag first:
#        EXPO_PUBLIC_UI_DRIVER=1 npx expo start
#   2. Booted simulators (defaults: iPhone 17 Pro Max for 6.9", iPad Pro 13-inch).
#   3. jq installed (brew install jq).
#
# Usage: scripts/store-screenshots.sh [out-dir]
set -euo pipefail
export DEVELOPER_DIR=${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${1:-$ROOT/dist/screenshots}
APP=$(ls -d "$ROOT"/ios/build/Build/Products/Debug-iphonesimulator/*.app | head -1)
BUNDLE=net.stg-sz.app
DRIVER_DIR=$(mktemp -d)
echo "" > "$DRIVER_DIR/route.txt"
(cd "$DRIVER_DIR" && python3 -m http.server 8099 --bind 127.0.0.1 >/dev/null 2>&1 &)
trap 'pkill -f "http.server 8099" >/dev/null 2>&1 || true' EXIT

drive() { echo "$1" > "$DRIVER_DIR/route.txt"; sleep "${2:-4}"; }
shoot() { xcrun simctl io "$UDID" screenshot "$OUT/$LABEL/$1.png" >/dev/null 2>&1; echo "  $LABEL/$1.png"; }

sim_udid() { xcrun simctl list devices available -j | jq -r --arg n "$1" '.devices | to_entries[] | select(.key|test("iOS-26")) | .value[] | select(.name==$n) | .udid' | head -1; }

for LABEL in "iphone-6.9:iPhone 17 Pro Max" "ipad-13:iPad Pro 13-inch (M5)"; do
  NAME=${LABEL#*:}; LABEL=${LABEL%%:*}
  UDID=$(sim_udid "$NAME"); [ -n "$UDID" ] || { echo "no simulator named $NAME"; continue; }
  mkdir -p "$OUT/$LABEL"
  xcrun simctl boot "$UDID" >/dev/null 2>&1 || true
  xcrun simctl ui "$UDID" appearance light
  xcrun simctl install "$UDID" "$APP"
  xcrun simctl terminate "$UDID" $BUNDLE >/dev/null 2>&1 || true
  xcrun simctl launch "$UDID" $BUNDLE >/dev/null
  echo "$NAME ($UDID)"
  sleep 14                                  # first load, images
  drive "navigate /" 2;          shoot 1-start
  drive "push /artikel/10751" 8; shoot 2-artikel
  drive "back" 3
  drive "navigate /ressorts" 6;  shoot 3-ressorts
  drive "navigate /redaktion" 6; shoot 4-redaktion
  xcrun simctl ui "$UDID" appearance dark; sleep 2
  drive "navigate /" 4;          shoot 5-start-dark
  drive "push /artikel/10677" 8; shoot 6-artikel-dark
  drive "back" 2
  xcrun simctl ui "$UDID" appearance light
done
echo "done → $OUT"
