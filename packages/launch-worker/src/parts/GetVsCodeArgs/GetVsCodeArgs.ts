import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.ts'

export const getVscodeArgs = ({ extensionsDir, userDataDir, extraLaunchArgs, inspectSharedProcess, inspectExtensions, inspectPtyHost }) => {
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
    '--disable-extensions',
    '--extensions-dir',
    extensionsDir,
    '--user-data-dir',
    userDataDir,
  ]

  if (inspectPtyHost) {
    args.push('--inspect-ptyhost=5877')
  }
  if (inspectSharedProcess) {
    args.push('--inspect-sharedprocess=5879')
  }
  if (inspectExtensions) {
    args.push('--inspect-extensions=5870')
  }
  args.push(...extraLaunchArgs)
  return args
}
