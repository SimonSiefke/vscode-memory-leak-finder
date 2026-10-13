#!/usr/bin/env bash
set -euo pipefail
sudo apt-get update
sudo apt-get install -y build-essential python3 libkrb5-dev libx11-dev libxkbfile-dev libsecret-1-dev libgtk-3-0 libnss3 libasound2t64 libgbm1 libxss1 xvfb xauth zstd linux-tools-common linux-tools-generic
perf_binary=$(ls /usr/lib/linux-tools/*/perf | sort -V | tail -1)
sudo ln -sf "$perf_binary" /usr/local/bin/perf
sudo sysctl kernel.perf_event_paranoid=-1
