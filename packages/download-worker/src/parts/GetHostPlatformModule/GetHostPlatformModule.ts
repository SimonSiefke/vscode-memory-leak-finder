import * as GetHostPlatformDarwin from '../GetHostPlatformDarwin/GetHostPlatformDarwin.ts'
import * as GetHostPlatformLinux from '../GetHostPlatformLinux/GetHostPlatformLinux.ts'
import * as GetHostPlatformWindows from '../GetHostPlatformWindows/GetHostPlatformWindows.ts'

interface HostPlatformFn {
  (arch: string): string | Promise<string>
}

export const getHostPlatformModule = (platform: string): HostPlatformFn => {
  switch (platform) {
    case 'darwin':
      return GetHostPlatformDarwin.getHostPlatform
    case 'linux':
      return (arch: string) => GetHostPlatformLinux.getHostPlatform(platform, arch)
    case 'win32':
      return GetHostPlatformWindows.getHostPlatform
    default:
      throw new Error(`unsupported platform ${platform}`)
  }
}
