#!/bin/bash

# Development setup script for VSCode Memory Leak Finder
# This script helps with common development tasks

set -e

echo "🚀 Setting up VSCode Memory Leak Finder development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "lerna.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Run type checking
echo "🔍 Running type check..."
npm run type-check

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Available commands:"
echo "  npm test          - Run all tests"
echo "  npm run e2e       - Run end-to-end tests"
echo "  npm run build     - Build the project"
echo "  npm run format    - Format code with Prettier"
echo "  npm run type-check - Run TypeScript type checking"
echo ""
echo "🌐 VNC Server is available on port 6080 (password: vscode)"
echo "🐛 Node.js debugger is available on port 9229"
