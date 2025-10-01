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
    '--disable-extensions',
    '--extensions-dir',
    extensionsDir,
    '--user-data-dir',
    userDataDir,
  ]
  
  if (inspectPtyHost) {
    args.push('--inspect-ptyhost')
  }
  if (inspectSharedProcess) {
    args.push('--inspect-sharedprocess')
  }
  if (inspectExtensions) {
    args.push('--inspect-extensions')
  }
  
  args.push(...extraLaunchArgs)
  return args
}
