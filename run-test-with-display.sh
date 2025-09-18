#!/bin/bash
set -e

echo "Starting virtual display for testing..."

# Start Xvfb if not already running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb..."
    Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
    sleep 3
fi

# Set display environment
export DISPLAY=:99

# Start D-Bus if not running
if ! pgrep -x "dbus-daemon" > /dev/null; then
    echo "Starting D-Bus..."
    service dbus start
fi

# Use Node.js 22 for Promise.withResolvers support
export NVM_DIR="/usr/local/share/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || echo "Node.js 22 already active"

echo "Environment ready. Running test..."
echo "Display: $DISPLAY"
echo "Node version: $(node --version)"

# Run the specific test
cd packages/e2e
exec node ../cli/bin/test.js --only welcome-page.edit --headless "$@"