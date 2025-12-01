export const getHostPlatformModule = (platform: string): Promise<any> => {
  switch (platform) {
    case 'darwin':
      return import('../GetHostPlatformDarwin/GetHostPlatformDarwin.ts')
    case 'linux':
      return import('../GetHostPlatformLinux/GetHostPlatformLinux.ts')
    case 'win32':
      return import('../GetHostPlatformWindows/GetHostPlatformWindows.ts')
    default:
      throw new Error(`unsupported platform ${platform}`)
  }
}
