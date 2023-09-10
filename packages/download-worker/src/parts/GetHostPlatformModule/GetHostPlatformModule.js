export const getHostPlatformModule = (platform) => {
  switch (platform) {
    case 'darwin':
      return import('../GetHostPlatformDarwin/GetHostPlatformDarwin.js')
    case 'linux':
      return import('../GetHostPlatformLinux/GetHostPlatformLinux.js')
    case 'win32':
      return import('../GetHostPlatformWindows/GetHostPlatformWindows.js')
    default:
      throw new Error(`unsupported platform ${platform}`)
  }
}
