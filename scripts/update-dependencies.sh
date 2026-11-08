#!/bin/bash

cd $(dirname "$0")
cd ..
set -e

command_exists(){
  command -v "$1" &> /dev/null
}

if ! command_exists "ncu"; then
    echo "npm-check-updates is not installed"
    npm i -g npm-check-updates
else
    echo "ncu is installed"
fi

echo "Updating dependencies in the root and all npm workspaces..."
ncu -u --workspaces \
  -x typescript -x jsdom -x babel/core -x @babel/preset-typescript -x @babel/parser \
  -x @babel/core -x @babel/code-frame -x @babel/generator -x @babel/traverse \
  -x @babel/types -x @lvce-editor/rpc
npm install
