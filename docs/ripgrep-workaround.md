# Ripgrep Pre-caching Workaround

## Problem

When building VSCode from source in the repository worker, `npm ci` fails to download `ripgrep-prebuilt` from GitHub using the GitHub API, which returns 403 errors in many cases. This happens because:

1. The `@vscode/ripgrep` package downloads ripgrep binaries from GitHub releases using the GitHub API
2. GitHub API has rate limits and can return 403 errors, especially in CI environments
3. The API-based download approach is less reliable than direct downloads

## Solution

This workaround pre-downloads the ripgrep-prebuilt binary directly from GitHub releases (bypassing the API) and places it in the correct cache location before running `npm ci`. When `npm ci` runs, the `@vscode/ripgrep` package detects the cached binary and skips the download.

## Implementation

### 1. Standalone Script

The `scripts/pre-cache-ripgrep.sh` script can be run independently:

```bash
./scripts/pre-cache-ripgrep.sh
```

**Features:**
- Automatically detects the target platform (Linux x64, ARM64, macOS, etc.)
- Downloads the appropriate ripgrep binary version
- Places it in the correct cache directory (`/tmp/vscode-ripgrep-cache-{version}/`)
- Supports retry logic with exponential backoff
- Skips download if already cached
- Works with both curl and wget

### 2. Integrated Solution

The repository worker automatically pre-caches ripgrep right after cloning the repository but before installing dependencies:

**Modified files:**
- `packages/repository-worker/src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts`
- `packages/repository-worker/src/parts/PreCacheRipgrep/PreCacheRipgrep.ts` (new)

**How it works:**
1. After cloning the VSCode repository and checking out the commit, `preCacheRipgrep()` is called
2. `preCacheRipgrep()` uses Node.js built-in modules to determine the target platform and download the appropriate binary
3. The binary is cached in `{tmpdir}/vscode-ripgrep-cache-{version}/`
4. When `npm ci` runs later, `@vscode/ripgrep` finds the cached binary and skips the API download
5. If pre-caching fails, a warning is logged but the build continues (may encounter GitHub API issues)

## Cache Location

The cache follows the same pattern as the original `@vscode/ripgrep` package:

```
/tmp/vscode-ripgrep-cache-{package-version}/ripgrep-{version}-{target}{extension}
```

**Examples:**
- Linux: `/tmp/vscode-ripgrep-cache-1.15.14/ripgrep-v13.0.0-13-x86_64-unknown-linux-musl.tar.gz`
- macOS: `/tmp/vscode-ripgrep-cache-1.15.14/ripgrep-v13.0.0-13-aarch64-apple-darwin.tar.gz`
- Windows: `%TEMP%\vscode-ripgrep-cache-1.15.14\ripgrep-v13.0.0-13-x86_64-pc-windows-msvc.zip`

## Supported Platforms

The solution supports all platforms that ripgrep-prebuilt provides:

**Linux:**
- x86_64-unknown-linux-musl
- aarch64-unknown-linux-musl  
- arm-unknown-linux-gnueabihf
- powerpc64le-unknown-linux-gnu
- riscv64gc-unknown-linux-gnu
- s390x-unknown-linux-gnu
- i686-unknown-linux-musl

**macOS:**
- x86_64-apple-darwin
- aarch64-apple-darwin

**Windows:**
- x86_64-pc-windows-msvc
- aarch64-pc-windows-msvc
- i686-pc-windows-msvc

## Version Handling

The solution handles different ripgrep versions:

- **Standard version:** `v13.0.0-13` (for most platforms)
- **Multi-arch version:** `v13.0.0-4` (for arm-unknown-linux-gnueabihf, powerpc64le-unknown-linux-gnu, s390x-unknown-linux-gnu)

This matches the logic in the original `@vscode/ripgrep` package.

## Testing

The solution has been tested to ensure:

1. ✅ The standalone script correctly downloads and caches ripgrep binaries
2. ✅ The integrated solution works with the repository worker
3. ✅ Cached binaries are recognized by `@vscode/ripgrep` during `npm ci`
4. ✅ The ripgrep binary is functional after installation
5. ✅ Existing tests continue to pass (with test modifications to skip caching)

## Usage in Repository Worker

The pre-caching is automatically enabled when using the repository worker. It runs right after cloning the repository but before installing dependencies. No additional configuration is needed.

The pre-caching is implemented with error handling - if it fails, a warning is logged but the build continues (though it may encounter GitHub API issues during `npm ci`).

## Manual Usage

To manually pre-cache ripgrep before running `npm ci` in a VSCode repository:

```bash
# Run the pre-cache script
./scripts/pre-cache-ripgrep.sh

# Then run npm ci as normal
npm ci
```

## Troubleshooting

**Issue:** Script fails with "Neither curl nor wget is available"
**Solution:** Install curl or wget on the system

**Issue:** Download fails with network errors
**Solution:** The script includes retry logic. Check network connectivity and GitHub availability.

**Issue:** Wrong platform detected
**Solution:** Set the `npm_config_arch` environment variable to override architecture detection

**Issue:** Cache directory permissions
**Solution:** Ensure the user has write permissions to `/tmp/`

## Technical Details

### Node.js Implementation

The integrated solution uses Node.js built-in modules for maximum compatibility:

- **Platform detection:** Uses `os.platform()` and `os.arch()` instead of shell commands
- **HTTP downloads:** Uses Node.js `https` module with redirect handling and timeouts
- **File system:** Uses Node.js `fs` module for file operations
- **Cross-platform:** Supports Linux, macOS, and Windows

### Error Handling

The implementation includes robust error handling:

- **Retry logic:** Downloads are retried up to 3 times with exponential backoff
- **Timeout handling:** 30-second timeout for downloads
- **Graceful degradation:** If pre-caching fails, the build continues with a warning
- **Cleanup:** Failed downloads are automatically cleaned up

## Future Improvements

1. **Environment variable support:** Allow overriding versions and cache locations
2. **Cleanup mechanism:** Automatically clean old cached versions
3. **Verification:** Add checksum verification for downloaded binaries
4. **Configuration:** Make the cache directory configurable
5. **Parallel downloads:** Support downloading multiple platform binaries simultaneously

## Related Issues

This workaround addresses the common issue where GitHub API rate limits cause VSCode builds to fail during the ripgrep download phase. It's particularly useful in:

- CI/CD environments
- Docker builds
- Environments with limited GitHub API access
- Situations where the GitHub API is temporarily unavailable

## References

- [microsoft/ripgrep-prebuilt](https://github.com/microsoft/ripgrep-prebuilt) - Source of ripgrep binaries
- [microsoft/vscode-ripgrep](https://github.com/microsoft/vscode-ripgrep) - NPM package that downloads ripgrep
- [@vscode/ripgrep on npm](https://www.npmjs.com/package/@vscode/ripgrep) - Current package