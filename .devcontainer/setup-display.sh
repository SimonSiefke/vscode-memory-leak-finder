#!/bin/bash
set -e

echo "Setting up X11 display and GUI support..."

# Update package list
apt-get update

# Install X11 and display server components
apt-get install -y \
    xvfb \
    x11-utils \
    x11-xserver-utils \
    dbus-x11 \
    xauth \
    xfonts-base \
    xfonts-encodings \
    xfonts-utils

# Install GUI libraries needed for VS Code
apt-get install -y \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libgconf-2-4 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libnss3-dev \
    libcups2 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxss1 \
    libgbm1 \
    libdrm2 \
    libxkbcommon0 \
    libwayland-client0 \
    libwayland-cursor0 \
    libwayland-egl1 \
    libxfixes3 \
    libxinerama1

# Start D-Bus service
service dbus start

# Create a script to start Xvfb
cat > /usr/local/bin/start-display.sh << 'EOF'
#!/bin/bash
export DISPLAY=:99
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2
echo "Display server started on :99"
EOF

chmod +x /usr/local/bin/start-display.sh

echo "Display setup complete!"