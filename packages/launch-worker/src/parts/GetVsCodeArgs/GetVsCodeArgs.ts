import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.ts'

export const getVscodeArgs = ({
  enableExtensions,
  enableProxy,
  extensionsDir,
  extraLaunchArgs,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  userDataDir,
}: {
  enableExtensions: boolean
  enableProxy: boolean
  extensionsDir: string
  extraLaunchArgs: string[]
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  userDataDir: string
}): string[] => {
  const proxyBypassList = '<-loopback>;localhost;127.0.0.1;0.0.0.0;::1'
  const args = [
    ...ChromiumSwitches.chromiumSwitches,
    '--wait',
    '--new-window',
    '--no-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    '--ozone-platform=x11',
    '--extensions-dir',
    extensionsDir,
    '--user-data-dir',
    userDataDir,
  ]

  // Ignore certificate errors when proxy is enabled (for MITM proxy)
  if (enableProxy) {
    args.push('--ignore-certificate-errors')
    args.push(`--proxy-bypass-list=${proxyBypassList}`)
  }

  if (!enableExtensions) {
    args.push('--disable-extensions')
  }

  if (inspectPtyHost) {
    args.push(`--inspect-ptyhost=${inspectPtyHostPort}`)
  }
  if (inspectSharedProcess) {
    args.push(`--inspect-sharedprocess=${inspectSharedProcessPort}`)
  }
  if (inspectExtensions) {
    args.push(`--inspect-extensions=${inspectExtensionsPort}`)
  }
  args.push(...extraLaunchArgs)
  return args
}
