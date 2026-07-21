import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.ts'

export const getVscodeArgs = ({
  enableExtensions,
  enableProxy,
  extensionsDir,
  extraLaunchArgs,
  vscodeAppPath = '',
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  platform = process.platform,
  userDataDir,
}: {
  enableExtensions: boolean
  enableProxy: boolean
  extensionsDir: string
  extraLaunchArgs: string[]
  vscodeAppPath?: string
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  platform?: string
  userDataDir: string
}): string[] => {
  const proxyBypassList = '<-loopback>;localhost;127.0.0.1;0.0.0.0;::1;chatgpt.com;ab.chatgpt.com'
  const args = [
    ...ChromiumSwitches.chromiumSwitches,
    '--wait',
    '--no-sandbox',
    '--force-disable-user-env',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
  ]
  if (platform === 'linux') {
    args.push('--ozone-platform=x11')
  }
  if (vscodeAppPath) {
    args.push(vscodeAppPath)
  }
  args.push('--extensions-dir', extensionsDir)
  args.push('--user-data-dir', userDataDir)
  if (enableProxy) {
    args.push('--ignore-certificate-errors')
    args.push(`--proxy-bypass-list=${proxyBypassList}`)
  }
  if (!enableExtensions) {
    args.push('--disable-extensions')
    args.push('--disable-extension=GitHub.copilot')
    args.push('--disable-extension=GitHub.copilot-chat')
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
