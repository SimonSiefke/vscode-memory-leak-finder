FROM ubuntu:24.04

# make sure apt is up to date
RUN apt-get update --fix-missing
RUN apt-get install -y \
  curl \
  git \
  gnupg2 \
  jq \
  sudo \
  zsh \
  python3 \
  build-essential \
  g++ \
  libx11-dev \
  libxkbfile-dev \
  libsecret-1-dev \
  python-is-python3 \
  python3-setuptools \
  fonts-liberation \
  libcairo2 \
  libasound2t64 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libegl1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libxshmfence1 \
  xvfb \
  libxtst6 \
  xauth

COPY . .
