import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.ts'

export const getVscodeArgs = ({ extensionsDir, userDataDir, extraLaunchArgs, inspectSharedProcess, inspectExtensions, inspectPtyHost }) => {
  return [
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
    // Enable debugging for utility processes
    '--inspect-ptyhost',
    '--inspect-sharedprocess',
    '--inspect-extensions',
    ...extraLaunchArgs,
  ]
}
