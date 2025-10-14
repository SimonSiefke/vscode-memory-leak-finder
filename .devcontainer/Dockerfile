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
  python3-setuptools


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

WORKDIR /home/

COPY . .

RUN bash ./setup.sh

RUN echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.zshrc"
RUN echo '\n' >> "$HOME/.zshrc"
RUN echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm' >> "$HOME/.zshrc"
