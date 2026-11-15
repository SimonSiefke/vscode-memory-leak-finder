import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.ts'

export const getVscodeArgs = ({
  enableExtensions,
  enableProxy,
  launchAgentWindow,
  extensionsDir,
  extraLaunchArgs,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  platform = process.platform,
  userDataDir,
  useProxyMock = false,
}: {
  enableExtensions: boolean
  enableProxy: boolean
  launchAgentWindow?: boolean | undefined
  extensionsDir: string
  extraLaunchArgs: string[]
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  platform?: string
  useProxyMock?: boolean
  userDataDir: string
}): string[] => {
  const proxyBypassList = '<-loopback>;localhost;127.0.0.1;0.0.0.0;::1'
  const args = [
    ...ChromiumSwitches.chromiumSwitches,
    '--wait',
    '--no-sandbox',
    '--force-disable-user-env',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    `--extensions-dir=${extensionsDir}`,
    `--user-data-dir=${userDataDir}`,
    '--enable-proposed-api=simon.speech-session-race-sample',
  ]
  if (launchAgentWindow) {
    if (useProxyMock) args.push('--enable-smoke-test-driver')
    args.push('--agents', '--skip-sessions-welcome', `--agents-user-data-dir=${userDataDir}`, `--agents-extensions-dir=${extensionsDir}`)
  }
  if (platform === 'linux') {
    args.push('--ozone-platform=x11')
  }

  // Ignore certificate errors when proxy is enabled (for MITM proxy)
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
