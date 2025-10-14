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

ENV NVM_VERSION v0.35.3
ENV NODE_VERSION v22.19.0


# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Install NVM
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/${NVM_VERSION}/install.sh | bash

# Install NODE
RUN source ~/.nvm/nvm.sh; \
    nvm install $NODE_VERSION; \
    nvm use --delete-prefix $NODE_VERSION;

RUN su node -c "echo 'umask 0002' >> /home/node/.bashrc"



RUN echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.zshrc"
RUN echo '\n' >> "$HOME/.zshrc"
RUN echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm' >> "$HOME/.zshrc"


ARG USERNAME=user-name-goes-here
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# [Optional] Set the default user. Omit if you want to keep the default as root.
USER $USERNAME

COPY . .
