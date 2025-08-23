#!/bin/bash

set -e

cd $(dirname "$0")
cd ..

command_exists(){
  command -v "$1" &> /dev/null
}

DPDM_CMD="dpdm"
if ! command_exists "$DPDM_CMD"; then
  echo "dpdm not found in PATH, using npx"
  DPDM_CMD="npx -y dpdm"
else
  echo "dpdm is installed"
fi

check_package(){
  PKG_DIR="$1"
  if [ ! -d "$PKG_DIR" ]; then
    return 0
  fi
  if [ ! -f "$PKG_DIR/package.json" ]; then
    echo "Skipping $(basename "$PKG_DIR"): no package.json"
    return 0
  fi

  # Resolve entry file from package.json main or sensible defaults
  MAIN=$(node -p "try{require('$PKG_DIR/package.json').main||''}catch(e){''}")
  ENTRY=""

  if [ -n "$MAIN" ] && [ -f "$PKG_DIR/$MAIN" ]; then
    ENTRY="$MAIN"
  else
    for CANDIDATE in \
      src/main.ts \
      src/main.js \
      src/index.ts \
      src/index.js \
      ; do
      if [ -f "$PKG_DIR/$CANDIDATE" ]; then
        ENTRY="$CANDIDATE"
        break
      fi
    done
    if [ -z "$ENTRY" ]; then
      # Try common *Main.ts/js patterns
      CAND=$(ls "$PKG_DIR"/src/*Main.ts 2>/dev/null | head -n 1)
      if [ -z "$CAND" ]; then
        CAND=$(ls "$PKG_DIR"/src/*Main.js 2>/dev/null | head -n 1)
      fi
      if [ -n "$CAND" ]; then
        ENTRY="${CAND#$PKG_DIR/}"
      fi
    fi
  fi

  if [ -z "$ENTRY" ]; then
    echo "Skipping $(basename "$PKG_DIR"): no entry file found"
    return 0
  fi

  echo "Checking $(basename "$PKG_DIR") ($ENTRY)"
  (cd "$PKG_DIR" && $DPDM_CMD --no-warning --no-tree --exit-code circular:1 "$ENTRY")
}

for PKG in packages/*; do
  check_package "$PKG"
done

echo "Great Success!"

sleep 2