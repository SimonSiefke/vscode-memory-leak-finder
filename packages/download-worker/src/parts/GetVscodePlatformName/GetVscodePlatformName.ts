export const getVscodePlatformName = (platform: string, arch: string): string => {
  if (platform === 'linux') {
    if (arch === 'arm64' || arch === 'aarch64') {
      return 'linux-arm64'
    }
    return 'linux-x64'
  }

  if (platform === 'darwin') {
    if (arch === 'arm64' || arch === 'aarch64') {
      return 'darwin-arm64'
    }
    return 'darwin-x64'
  }

  if (platform === 'win32') {
    if (arch === 'arm64' || arch === 'aarch64') {
      return 'win32-arm64-archive'
    }
    return 'win32-x64-archive'
  }

  throw new Error(`Unsupported platform: ${platform}`)
}
