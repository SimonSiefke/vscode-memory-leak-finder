import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.ts'

export const getVscodeArgs = ({
  extensionsDir,
  userDataDir,
  extraLaunchArgs,
  inspectSharedProcess,
  inspectExtensions,
  inspectPtyHost,
  enableExtensions,
  inspectPtyHostPort,
  inspectSharedProcessPort,
  inspectExtensionsPort,
}) => {
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
