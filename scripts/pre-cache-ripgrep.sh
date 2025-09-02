#!/bin/bash

# Pre-cache ripgrep-prebuilt to avoid GitHub API 403 errors during npm ci
# This script downloads ripgrep binaries directly from GitHub releases without using the API

set -e

# Configuration
RIPGREP_VERSION="v13.0.0-13"
MULTI_ARCH_VERSION="v13.0.0-4"  # For arm and powerpc64le
PACKAGE_VERSION="1.15.14"  # Current @vscode/ripgrep version
CACHE_DIR="/tmp/vscode-ripgrep-cache-${PACKAGE_VERSION}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to determine the target platform
get_target() {
    local arch="${npm_config_arch:-$(uname -m)}"
    local platform="$(uname -s)"
    
    case "$platform" in
        Darwin)
            case "$arch" in
                arm64|aarch64) echo "aarch64-apple-darwin" ;;
                *) echo "x86_64-apple-darwin" ;;
            esac
            ;;
        Linux)
            case "$arch" in
                x86_64) echo "x86_64-unknown-linux-musl" ;;
                aarch64|arm64) echo "aarch64-unknown-linux-musl" ;;
                armv7l|arm) echo "arm-unknown-linux-gnueabihf" ;;
                ppc64le) echo "powerpc64le-unknown-linux-gnu" ;;
                riscv64) echo "riscv64gc-unknown-linux-gnu" ;;
                s390x) echo "s390x-unknown-linux-gnu" ;;
                i686|i386) echo "i686-unknown-linux-musl" ;;
                *) echo "x86_64-unknown-linux-musl" ;;
            esac
            ;;
        MINGW*|CYGWIN*|MSYS*)
            case "$arch" in
                x86_64) echo "x86_64-pc-windows-msvc" ;;
                aarch64|arm64) echo "aarch64-pc-windows-msvc" ;;
                *) echo "i686-pc-windows-msvc" ;;
            esac
            ;;
        *)
            error "Unsupported platform: $platform"
            exit 1
            ;;
    esac
}

# Function to get the appropriate version for the target
get_version_for_target() {
    local target="$1"
    case "$target" in
        arm-unknown-linux-gnueabihf|powerpc64le-unknown-linux-gnu|s390x-unknown-linux-gnu)
            echo "$MULTI_ARCH_VERSION"
            ;;
        *)
            echo "$RIPGREP_VERSION"
            ;;
    esac
}

# Function to get file extension based on platform
get_extension() {
    case "$(uname -s)" in
        MINGW*|CYGWIN*|MSYS*) echo ".zip" ;;
        *) echo ".tar.gz" ;;
    esac
}

# Function to download file with retries
download_with_retry() {
    local url="$1"
    local output="$2"
    local max_retries=3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        log "Downloading $url (attempt $((retry + 1))/$max_retries)"
        
        if command -v curl >/dev/null 2>&1; then
            if curl -L -f -o "$output" "$url"; then
                return 0
            fi
        elif command -v wget >/dev/null 2>&1; then
            if wget -O "$output" "$url"; then
                return 0
            fi
        else
            error "Neither curl nor wget is available"
            exit 1
        fi
        
        retry=$((retry + 1))
        if [ $retry -lt $max_retries ]; then
            warn "Download failed, retrying in 2 seconds..."
            sleep 2
        fi
    done
    
    error "Failed to download after $max_retries attempts"
    return 1
}

# Main function
main() {
    log "Pre-caching ripgrep-prebuilt to avoid GitHub API issues"
    
    # Determine target platform
    local target
    target=$(get_target)
    log "Detected target: $target"
    
    # Get appropriate version
    local version
    version=$(get_version_for_target "$target")
    log "Using version: $version"
    
    # Get file extension
    local extension
    extension=$(get_extension)
    
    # Construct asset name
    local asset_name="ripgrep-${version}-${target}${extension}"
    log "Asset name: $asset_name"
    
    # Create cache directory
    mkdir -p "$CACHE_DIR"
    log "Cache directory: $CACHE_DIR"
    
    # Check if already cached
    local cache_path="$CACHE_DIR/$asset_name"
    if [ -f "$cache_path" ] && [ -s "$cache_path" ]; then
        log "Asset already cached at: $cache_path"
        return 0
    fi
    
    # Construct direct download URL (bypassing GitHub API)
    local download_url="https://github.com/microsoft/ripgrep-prebuilt/releases/download/${version}/${asset_name}"
    
    # Download the asset
    log "Downloading from: $download_url"
    if download_with_retry "$download_url" "$cache_path"; then
        log "Successfully cached ripgrep asset at: $cache_path"
        
        # Verify the download
        if [ -f "$cache_path" ] && [ -s "$cache_path" ]; then
            local size
            size=$(du -h "$cache_path" | cut -f1)
            log "Downloaded file size: $size"
        else
            error "Downloaded file is empty or missing"
            rm -f "$cache_path"
            exit 1
        fi
    else
        error "Failed to download ripgrep asset"
        exit 1
    fi
}

# Run main function
main "$@"