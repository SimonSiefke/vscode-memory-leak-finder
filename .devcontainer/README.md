# Dev Container Setup

This directory contains the configuration for running the VSCode Memory Leak Finder project in a development container, which works with:

- **GitHub Codespaces** - Click the "Code" button on GitHub and select "Open with Codespaces"
- **VS Code Dev Containers** - Use the "Dev Containers" extension in VS Code
- **Docker** - Build and run the container locally

## What's Included

The dev container includes:

- **Node.js 22.19.0** - Matches the version specified in `.nvmrc`
- **VNC Server** - For running GUI applications (Electron)
- **JWM Window Manager** - Lightweight window manager for VNC
- **Electron Dependencies** - Basic libraries for Electron apps

## Getting Started

1. **GitHub Codespaces**: Click the "Code" button on the repository and select "Open with Codespaces"
2. **VS Code**: Install the "Dev Containers" extension and use "Reopen in Container"
3. **Local Docker**: Build and run the container manually

## Port Forwarding

- **Port 6080**: VNC server for GUI access (automatically forwarded)

## Commands

The container automatically runs:

- `npm ci` - Install dependencies

## Development Workflow

1. The container will automatically install dependencies
2. Use `npm test` to run tests
3. Use `npm run e2e` to run end-to-end tests
4. Use `npm run build` to build the project

## Troubleshooting

If you encounter issues:

1. **VNC Connection**: The VNC server runs on port 6080 with password "vscode"
2. **Node Version**: The container uses Node.js 22.19.0 as specified in `.nvmrc`
3. **Dependencies**: Basic system dependencies for Electron are pre-installed
