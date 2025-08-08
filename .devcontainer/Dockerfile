FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bullseye

# Install VNC and Electron dependencies
RUN apt-get update && apt-get install -y \
    tigervnc-standalone-server \
    jwm \
    libgtk-3-0 \
    libnss3 \
    libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up VNC
ENV DISPLAY=:1
ENV VNC_PASSWORD=vscode

# Create VNC startup script
RUN echo '#!/bin/bash\n\
mkdir -p ~/.vnc\n\
echo "$VNC_PASSWORD" | vncpasswd -f > ~/.vnc/passwd\n\
chmod 600 ~/.vnc/passwd\n\
vncserver :1 -geometry 1920x1080 -depth 24\n\
jwm &\n\
exec "$@"' > /usr/local/bin/start-vnc.sh \
    && chmod +x /usr/local/bin/start-vnc.sh

CMD ["/usr/local/bin/start-vnc.sh", "sleep", "infinity"]
