#!/bin/bash

cd $(dirname "$0")
cd ..

command_exists(){
  command -v "$1" &> /dev/null
}

if ! command_exists "ncu"; then
    echo "npm-check-updates is not installed"
    npm i -g npm-check-updates
else
    echo "ncu is installed"
fi

function updateDependencies {
  echo "updating dependencies..."
  OUTPUT=`ncu -u -x @types/node -x @types/jest -x rollup -x jest -x @jest/globals`
  SUB='All dependencies match the latest package versions'
  if [[ "$OUTPUT" == *"$SUB"* ]]; then
    echo "$OUTPUT"
  else
    rm -rf node_modules package-lock.json dist
    npm install
  fi
}

updateDependencies &&
cd packages/build && updateDependencies && cd ../../ &&
cd packages/cli && updateDependencies && cd ../../ &&
cd packages/charts && updateDependencies && cd ../../ &&
cd packages/chart-worker && updateDependencies && cd ../../ &&
cd packages/cursor-e2e && updateDependencies && cd ../../ &&
cd packages/devtools-protocol && updateDependencies && cd ../../ &&
cd packages/download-worker && updateDependencies && cd ../../ &&
cd packages/e2e && updateDependencies && cd ../../ &&
cd packages/file-watcher-worker && updateDependencies && cd ../../ &&
cd packages/heap-snapshot-worker && updateDependencies && cd ../../ &&
cd packages/injected-code && updateDependencies && cd ../../ &&
cd packages/load-source-map-worker && updateDependencies && cd ../../ &&
cd packages/memory-leak-finder && updateDependencies && cd ../../ &&
cd packages/memory-leak-worker && updateDependencies && cd ../../ &&
cd packages/page-object && updateDependencies && cd ../../ &&
cd packages/source-map-worker && updateDependencies && cd ../../ &&
cd packages/stdout-worker && updateDependencies && cd ../../ &&
cd packages/test-coordinator && updateDependencies && cd ../../ &&
cd packages/test-worker && updateDependencies && cd ../../ &&
cd packages/test-worker-commands && updateDependencies && cd ../../ &&
cd packages/video-recording-worker && updateDependencies && cd ../../ &&

echo "Great Success!"

sleep 2